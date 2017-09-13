var GoVis = (function () {
'use strict';

function ___$insertStyle(css) {
  if (!css) {
    return;
  }
  if (typeof window === 'undefined') {
    return;
  }

  var style = document.createElement('style');

  style.setAttribute('type', 'text/css');
  style.innerHTML = css;
  document.head.appendChild(style);

  return css;
}

___$insertStyle("go-vis {\n  font-family: Roboto; }\n  go-vis span {\n    margin-left: .5em; }\n  go-vis ul {\n    list-style: none;\n    margin: 0;\n    padding: 0; }\n  go-vis > ul {\n    padding: 1.5em;\n    border: 1px solid #CACACA;\n    columns: 2;\n    -webkit-columns: 2;\n    -moz-columns: 2; }\n  go-vis li ul {\n    display: none; }\n  go-vis li.open > ul {\n    display: block; }\n  go-vis li {\n    line-height: 2em; }\n    go-vis li.branch > div {\n      cursor: pointer; }\n      go-vis li.branch > div::after {\n        content: '';\n        display: inline-block;\n        margin: .5em;\n        vertical-align: text-bottom;\n        border: solid #CACACA;\n        border-width: 0 3px 3px 0;\n        padding: 3px;\n        transform: rotate(45deg);\n        -webkit-transform: rotate(45deg);\n        transition: 0.5s ease-in-out;\n        -webkit-transition: 0.5s ease-in-out;\n        -moz-transition: 0.5s ease-in-out;\n        -o-transition: 0.5s ease-in-out; }\n    go-vis li.open.branch > div::after {\n      transform: rotate(-145deg);\n      -webkit-transform: rotate(-145deg); }\n  go-vis .evidence-tag {\n    font-size: .7em;\n    padding: .5em;\n    background-color: #d3e8fe; }\n");

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _CustomElement() {
    return Reflect.construct(HTMLElement, [], this.__proto__.constructor);
}


Object.setPrototypeOf(_CustomElement.prototype, HTMLElement.prototype);
Object.setPrototypeOf(_CustomElement, HTMLElement);
var GoVis = function (_CustomElement2) {
    _inherits(GoVis, _CustomElement2);

    function GoVis() {
        _classCallCheck(this, GoVis);

        var _this = _possibleConstructorReturn(this, (GoVis.__proto__ || Object.getPrototypeOf(GoVis)).call(this));

        _this.annotationTerms = [];
        _this.goRootNodes = ['GO:0008150', 'GO:0003674', 'GO:0005575'];
        _this.accession = '';
        return _this;
    }

    _createClass(GoVis, [{
        key: 'connectedCallback',
        value: function connectedCallback() {
            this.loadData();
        }
    }, {
        key: 'attributeChangedCallback',
        value: function attributeChangedCallback(attrName, oldVal, newVal) {
            if (oldVal !== null) {
                this.innerHTML = ''; //this should be avoided
                this.loadData();
            }
        }
    }, {
        key: 'loadData',
        value: function loadData() {
            var _this2 = this;

            console.log('loading...');
            this.getAnnotationTerms(this.accession).then(function (stream) {
                stream.json().then(function (d) {
                    _this2.annotationTerms = d.dbReferences.filter(function (d) {
                        return d.type === 'GO';
                    });
                    var goIds = _this2.annotationTerms.filter(function (d) {
                        return d.type === 'GO';
                    }).map(function (d) {
                        return d.id;
                    });
                    _this2.getSlimSet().then(function (stream) {
                        stream.json().then(function (d) {
                            var slimIds = d.goSlimSets.filter(function (f) {
                                return f.name === _this2.slimset;
                            })[0].associations.map(function (term) {
                                return term.id;
                            });
                            // remove root nodes
                            var _iteratorNormalCompletion = true;
                            var _didIteratorError = false;
                            var _iteratorError = undefined;

                            try {
                                for (var _iterator = _this2.goRootNodes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                                    var rootNode = _step.value;

                                    slimIds.splice(slimIds.indexOf(rootNode), 1);
                                }
                            } catch (err) {
                                _didIteratorError = true;
                                _iteratorError = err;
                            } finally {
                                try {
                                    if (!_iteratorNormalCompletion && _iterator.return) {
                                        _iterator.return();
                                    }
                                } finally {
                                    if (_didIteratorError) {
                                        throw _iteratorError;
                                    }
                                }
                            }

                            _this2.getTermGraph(goIds, slimIds).then(function (d) {
                                return d.json().then(function (graph) {
                                    var tree = _this2.buildTree(graph.results[0].vertices, graph.results[0].edges);
                                    var ul = document.createElement('ul');
                                    _this2.renderSlimsTree(tree, ul);
                                    _this2.appendChild(ul);
                                    console.log('Loaded');
                                });
                            });
                        });
                    });
                });
            });
        }
    }, {
        key: 'getAnnotationTerms',
        value: function getAnnotationTerms(accession) {
            var headers = new Headers({
                'Accept': 'application/json'
            });
            var init = {
                method: 'GET',
                headers: headers,
                mode: 'cors',
                cached: 'default'
            };
            return fetch('https://www.ebi.ac.uk/proteins/api/proteins/' + accession, init);
        }
    }, {
        key: 'getSlimSet',
        value: function getSlimSet() {
            return fetch('https://www.ebi.ac.uk/QuickGO/services/internal/presets?fields=goSlimSets');
        }
    }, {
        key: 'getTermGraph',
        value: function getTermGraph(goIds, slimIds) {
            return fetch('https://wwwdev.ebi.ac.uk/QuickGO/services/ontology/go/terms/graph?startIds=' + goIds + '&stopIds=' + slimIds + '&relations=is_a');
        }
    }, {
        key: 'buildTree',
        value: function buildTree(nodes, edges) {
            // Initialise node array
            nodes.map(function (n) {
                return n.children = [];
            });
            var rootNodes = nodes.map(function (n) {
                return n.id;
            });
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                var _loop = function _loop() {
                    var edge = _step2.value;

                    var parent = nodes.filter(function (node) {
                        return node.id === edge.object;
                    })[0];
                    var child = nodes.filter(function (node) {
                        return node.id === edge.subject;
                    })[0];
                    // check for bug in backend
                    if (!parent || !child) {
                        return 'continue';
                    }
                    if (rootNodes.indexOf(child.id) >= 0) {
                        rootNodes.splice(rootNodes.indexOf(child.id), 1);
                    }
                    parent.children.push(child);
                };

                for (var _iterator2 = edges[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var _ret = _loop();

                    if (_ret === 'continue') continue;
                }
                // Return root nodes
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }

            return nodes.filter(function (node) {
                var _iteratorNormalCompletion3 = true;
                var _didIteratorError3 = false;
                var _iteratorError3 = undefined;

                try {
                    for (var _iterator3 = rootNodes[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                        var rootNode = _step3.value;

                        if (node.id === rootNode) {
                            return true;
                        }
                    }
                } catch (err) {
                    _didIteratorError3 = true;
                    _iteratorError3 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion3 && _iterator3.return) {
                            _iterator3.return();
                        }
                    } finally {
                        if (_didIteratorError3) {
                            throw _iteratorError3;
                        }
                    }
                }

                return false;
            });
        }
    }, {
        key: 'renderGoTerm',
        value: function renderGoTerm(node) {
            var div = document.createElement('div');
            var li = document.createElement('li');
            var a = document.createElement('a');
            a.setAttribute('href', 'http://www.ebi.ac.uk/QuickGO-Beta/term/' + node.id);
            a.textContent = node.id;
            var span = document.createElement('span');
            var annotationNode = this.annotationTerms.find(function (d) {
                return d.id === node.id;
            });
            span.style.fontWeight = annotationNode ? 'bold' : 'normal';
            span.textContent = node.label;
            div.appendChild(a);
            div.appendChild(span);
            li.appendChild(div);
            if (annotationNode) {
                div.appendChild(this.getRenderSource(annotationNode.properties));
            }
            if (node.children && node.children.length > 0) {
                div.addEventListener('click', this.nodeClick);
                li.classList.add('branch');
            }
            return li;
        }
    }, {
        key: 'renderSlimsTree',
        value: function renderSlimsTree(children, el) {
            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = children[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var node = _step4.value;

                    var li = this.renderGoTerm(node);
                    el.appendChild(li);
                    if (node.children && node.children.length > 0) {
                        var endNodes = this.traverseTree(node.children);
                        var ul = document.createElement('ul');
                        ul.style.marginLeft = '1em';
                        var _iteratorNormalCompletion5 = true;
                        var _didIteratorError5 = false;
                        var _iteratorError5 = undefined;

                        try {
                            for (var _iterator5 = endNodes[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                                var endNode = _step5.value;

                                var endLi = this.renderGoTerm(endNode);
                                ul.appendChild(endLi);
                            }
                        } catch (err) {
                            _didIteratorError5 = true;
                            _iteratorError5 = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion5 && _iterator5.return) {
                                    _iterator5.return();
                                }
                            } finally {
                                if (_didIteratorError5) {
                                    throw _iteratorError5;
                                }
                            }
                        }

                        li.appendChild(ul);
                    }
                }
            } catch (err) {
                _didIteratorError4 = true;
                _iteratorError4 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion4 && _iterator4.return) {
                        _iterator4.return();
                    }
                } finally {
                    if (_didIteratorError4) {
                        throw _iteratorError4;
                    }
                }
            }
        }
    }, {
        key: 'traverseTree',
        value: function traverseTree(children) {
            var endNodes = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : new Set();
            var _iteratorNormalCompletion6 = true;
            var _didIteratorError6 = false;
            var _iteratorError6 = undefined;

            try {
                for (var _iterator6 = children[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                    var node = _step6.value;

                    if (node.children && node.children.length > 0) {
                        this.traverseTree(node.children, endNodes);
                    } else {
                        endNodes.add(node);
                    }
                }
            } catch (err) {
                _didIteratorError6 = true;
                _iteratorError6 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion6 && _iterator6.return) {
                        _iterator6.return();
                    }
                } finally {
                    if (_didIteratorError6) {
                        throw _iteratorError6;
                    }
                }
            }

            return endNodes;
        }
    }, {
        key: 'nodeClick',
        value: function nodeClick() {
            this.parentElement.classList.toggle('open');
        }
    }, {
        key: 'getRenderSource',
        value: function getRenderSource(source) {
            var span = document.createElement('span');
            span.classList.add('evidence-tag');
            span.textContent = source.source;
            return span;
        }
    }, {
        key: 'expandAll',
        value: function expandAll() {
            var _iteratorNormalCompletion7 = true;
            var _didIteratorError7 = false;
            var _iteratorError7 = undefined;

            try {
                for (var _iterator7 = this.querySelectorAll('.branch')[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                    var li = _step7.value;

                    li.classList.add('open');
                }
            } catch (err) {
                _didIteratorError7 = true;
                _iteratorError7 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion7 && _iterator7.return) {
                        _iterator7.return();
                    }
                } finally {
                    if (_didIteratorError7) {
                        throw _iteratorError7;
                    }
                }
            }
        }
    }, {
        key: 'collapseAll',
        value: function collapseAll() {
            var _iteratorNormalCompletion8 = true;
            var _didIteratorError8 = false;
            var _iteratorError8 = undefined;

            try {
                for (var _iterator8 = this.querySelectorAll('.open')[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                    var li = _step8.value;

                    li.classList.remove('open');
                }
            } catch (err) {
                _didIteratorError8 = true;
                _iteratorError8 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion8 && _iterator8.return) {
                        _iterator8.return();
                    }
                } finally {
                    if (_didIteratorError8) {
                        throw _iteratorError8;
                    }
                }
            }
        }
    }, {
        key: 'accession',
        set: function set(acc) {
            if (acc) {
                this.setAttribute('accession', acc);
            }
        },
        get: function get() {
            return this.getAttribute('accession');
        }
    }, {
        key: 'slimset',
        get: function get() {
            return this.getAttribute('slimset');
        },
        set: function set(slimset) {
            if (slimset) {
                this.setAttribute('slimset', slimset);
            }
        }
    }], [{
        key: 'observedAttributes',
        get: function get() {
            return ['accession', 'slimset'];
        }
    }]);

    return GoVis;
}(_CustomElement);

customElements.define('go-vis', GoVis);

return GoVis;

}());
//# sourceMappingURL=govis.js.map
