import './govis.scss';

class UuwGoComponent extends HTMLElement {
    constructor() {
        super();
        this.annotationTerms = [];
        this.goRootNodes = ['GO:0008150', 'GO:0003674', 'GO:0005575'];
        this.accession = '';
    }

    connectedCallback() {
        this.loadData();
    }

    attributeChangedCallback(attrName, oldVal, newVal) {
        if (oldVal !== null) {
            this.innerHTML = ''; //this should be avoided
            this.loadData();
        }
    }

    static get observedAttributes() {
        return ['accession', 'slimset'];
    }

    set accession(acc) {
        if (acc) {
            this.setAttribute('accession', acc);
        }
    }

    get slimset() {
        return this.getAttribute('slimset');
    }

    set slimset(slimset) {
        if (slimset) {
            this.setAttribute('slimset', slimset);
        }
    }

    get accession() {
        return this.getAttribute('accession');
    }

    loadData() {
        console.log('loading...')
        this
            .getAnnotationTerms(this.accession)
            .then(stream => {
                stream
                    .json()
                    .then(d => {
                        this.annotationTerms = d
                            .dbReferences
                            .filter(d => d.type === 'GO');
                        let goIds = this
                            .annotationTerms
                            .filter(d => d.type === 'GO')
                            .map(d => d.id);
                        this
                            .getSlimSet()
                            .then(stream => {
                                stream
                                    .json()
                                    .then(d => {
                                        const slimIds = d
                                            .goSlimSets
                                            .filter(f => f.name === this.slimset)[0]
                                            .associations
                                            .map(term => term.id);
                                        // remove root nodes
                                        for (const rootNode of this.goRootNodes) {
                                            slimIds.splice(slimIds.indexOf(rootNode), 1);
                                        }
                                        this
                                            .getTermGraph(goIds, slimIds)
                                            .then(d => d.json().then(graph => {
                                                const tree = this.buildTree(graph.results[0].vertices, graph.results[0].edges);
                                                const ul = document.createElement('ul');
                                                this.renderSlimsTree(tree, ul);
                                                this.appendChild(ul);
                                                console.log('Loaded')
                                            }));
                                    });
                            })
                    });
            });
    }

    getAnnotationTerms(accession) {
        const headers = new Headers({'Accept': 'application/json'});
        const init = {
            method: 'GET',
            headers: headers,
            mode: 'cors',
            cached: 'default'
        }
        return fetch(`https://www.ebi.ac.uk/proteins/api/proteins/${accession}`, init);
    }

    getSlimSet() {
        return fetch('https://www.ebi.ac.uk/QuickGO/services/internal/presets?fields=goSlimSets');
    }

    getTermGraph(goIds, slimIds) {
        return fetch(`https://wwwdev.ebi.ac.uk/QuickGO/services/ontology/go/terms/graph?startIds=${goIds}&stopIds=${slimIds}&relations=is_a`);
    }

    buildTree(nodes, edges) {
        // Initialise node array
        nodes.map(n => n.children = []);
        let rootNodes = nodes.map(n => n.id);
        for (const edge of edges) {
            let parent = nodes.filter(node => node.id === edge.object)[0];
            let child = nodes.filter(node => node.id === edge.subject)[0];
            // check for bug in backend
            if (!parent || !child) {
                continue;
            }
            if (rootNodes.indexOf(child.id) >= 0) {
                rootNodes.splice(rootNodes.indexOf(child.id), 1);
            }
            parent
                .children
                .push(child);
        }
        // Return root nodes
        return nodes.filter(node => {
            for (const rootNode of rootNodes) {
                if (node.id === rootNode) {
                    return true;
                }
            }
            return false;
        })
    }

    renderGoTerm(node) {
        const div = document.createElement('div');
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.setAttribute('href', `http://www.ebi.ac.uk/QuickGO-Beta/term/${node.id}`);
        a.textContent = node.id;
        const span = document.createElement('span');
        let annotationNode = this
            .annotationTerms
            .find(d => d.id === node.id);
        span.style.fontWeight = annotationNode
            ? 'bold'
            : 'normal';
        span.textContent = node.label;
        div.appendChild(a);
        div.appendChild(span);
        li.appendChild(div);
        if (annotationNode) {
            div.appendChild(this.getRenderSource(annotationNode));
        }
        if (node.children && node.children.length > 0) {
            div.addEventListener('click', this.nodeClick);
            li
                .classList
                .add('branch');
        }
        return li;
    }

    renderSlimsTree(children, el) {
        for (const node of children) {
            if (this.goRootNodes.includes(node.id)) {
                continue;
            }
            const li = this.renderGoTerm(node);
            el.appendChild(li);
            if (node.children && node.children.length > 0) {
                const endNodes = this.traverseTree(node.children);
                const ul = document.createElement('ul');
                ul.style.marginLeft = '1em';
                for (const endNode of endNodes) {
                    const endLi = this.renderGoTerm(endNode);
                    ul.appendChild(endLi);
                }
                li.appendChild(ul);
            }
        }
    }

    traverseTree(children, endNodes = new Set()) {
        for (const node of children) {
            if (node.children && node.children.length > 0) {
                this.traverseTree(node.children, endNodes)
            } else {
                endNodes.add(node);
            }
        }
        return endNodes;
    }

    nodeClick() {
        this
            .parentElement
            .classList
            .toggle('open');
    }

    getRenderSource(source) {
        const span = document.createElement('span');
        span
            .classList
            .add('evidence-tag');
        span.textContent = source.properties.source;
        if (source.evidences) {
            let evidences = '';
            for (const evidence of source.evidences) {
                evidences = `${evidences} ${evidence.source.name}:${evidence.source.id}`;
            }
            span.title = evidences;
        }
        return span;
    }

    expandAll() {
        for (const li of this.querySelectorAll('.branch')) {
            li
                .classList
                .add('open');
        }
    }

    collapseAll() {
        for (const li of this.querySelectorAll('.open')) {
            li
                .classList
                .remove('open');
        }
    }
}

customElements.define('uuw-go-component', UuwGoComponent);

export default UuwGoComponent;