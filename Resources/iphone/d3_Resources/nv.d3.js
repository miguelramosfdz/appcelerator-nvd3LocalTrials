(function() {
    function daysInMonth(month, year) {
        return new Date(year, month + 1, 0).getDate();
    }
    function d3_time_range(floor, step, number) {
        return function(t0, t1, dt) {
            var time = floor(t0), times = [];
            t0 > time && step(time);
            if (dt > 1) while (t1 > time) {
                var date = new Date(+time);
                0 === number(date) % dt && times.push(date);
                step(time);
            } else while (t1 > time) {
                times.push(new Date(+time));
                step(time);
            }
            return times;
        };
    }
    var nv = window.nv || {};
    nv.version = "1.1.15b";
    nv.dev = true;
    window.nv = nv;
    nv.tooltip = nv.tooltip || {};
    nv.utils = nv.utils || {};
    nv.models = nv.models || {};
    nv.charts = {};
    nv.graphs = [];
    nv.logs = {};
    nv.dispatch = d3.dispatch("render_start", "render_end");
    if (nv.dev) {
        nv.dispatch.on("render_start", function() {
            nv.logs.startTime = +new Date();
        });
        nv.dispatch.on("render_end", function() {
            nv.logs.endTime = +new Date();
            nv.logs.totalTime = nv.logs.endTime - nv.logs.startTime;
            nv.log("total", nv.logs.totalTime);
        });
    }
    nv.log = function() {
        if (nv.dev && console.log && console.log.apply) console.log.apply(console, arguments); else if (nv.dev && "function" == typeof console.log && Function.prototype.bind) {
            var log = Function.prototype.bind.call(console.log, console);
            log.apply(console, arguments);
        }
        return arguments[arguments.length - 1];
    };
    nv.render = function(step) {
        step = step || 1;
        nv.render.active = true;
        nv.dispatch.render_start();
        setTimeout(function() {
            var chart, graph;
            for (var i = 0; step > i && (graph = nv.render.queue[i]); i++) {
                chart = graph.generate();
                typeof graph.callback == typeof Function && graph.callback(chart);
                nv.graphs.push(chart);
            }
            nv.render.queue.splice(0, i);
            if (nv.render.queue.length) setTimeout(arguments.callee, 0); else {
                nv.dispatch.render_end();
                nv.render.active = false;
            }
        }, 0);
    };
    nv.render.active = false;
    nv.render.queue = [];
    nv.addGraph = function(obj) {
        typeof arguments[0] == typeof Function && (obj = {
            generate: arguments[0],
            callback: arguments[1]
        });
        nv.render.queue.push(obj);
        nv.render.active || nv.render();
    };
    nv.identity = function(d) {
        return d;
    };
    nv.strip = function(s) {
        return s.replace(/(\s|&)/g, "");
    };
    d3.time.monthEnd = function(date) {
        return new Date(date.getFullYear(), date.getMonth(), 0);
    };
    d3.time.monthEnds = d3_time_range(d3.time.monthEnd, function(date) {
        date.setUTCDate(date.getUTCDate() + 1);
        date.setDate(daysInMonth(date.getMonth() + 1, date.getFullYear()));
    }, function(date) {
        return date.getMonth();
    });
    nv.interactiveGuideline = function() {
        "use strict";
        function layer(selection) {
            selection.each(function(data) {
                function mouseHandler() {
                    var d3mouse = d3.mouse(this);
                    var mouseX = d3mouse[0];
                    var mouseY = d3mouse[1];
                    var subtractMargin = true;
                    var mouseOutAnyReason = false;
                    if (isMSIE) {
                        mouseX = d3.event.offsetX;
                        mouseY = d3.event.offsetY;
                        "svg" !== d3.event.target.tagName && (subtractMargin = false);
                        d3.event.target.className.baseVal.match("nv-legend") && (mouseOutAnyReason = true);
                    }
                    if (subtractMargin) {
                        mouseX -= margin.left;
                        mouseY -= margin.top;
                    }
                    if (0 > mouseX || 0 > mouseY || mouseX > availableWidth || mouseY > availableHeight || d3.event.relatedTarget && void 0 === d3.event.relatedTarget.ownerSVGElement || mouseOutAnyReason) {
                        if (isMSIE && d3.event.relatedTarget && void 0 === d3.event.relatedTarget.ownerSVGElement && d3.event.relatedTarget.className.match(tooltip.nvPointerEventsClass)) return;
                        dispatch.elementMouseout({
                            mouseX: mouseX,
                            mouseY: mouseY
                        });
                        layer.renderGuideLine(null);
                        return;
                    }
                    var pointXValue = xScale.invert(mouseX);
                    dispatch.elementMousemove({
                        mouseX: mouseX,
                        mouseY: mouseY,
                        pointXValue: pointXValue
                    });
                    "dblclick" === d3.event.type && dispatch.elementDblclick({
                        mouseX: mouseX,
                        mouseY: mouseY,
                        pointXValue: pointXValue
                    });
                }
                var container = d3.select(this);
                var availableWidth = width || 960, availableHeight = height || 400;
                var wrap = container.selectAll("g.nv-wrap.nv-interactiveLineLayer").data([ data ]);
                var wrapEnter = wrap.enter().append("g").attr("class", " nv-wrap nv-interactiveLineLayer");
                wrapEnter.append("g").attr("class", "nv-interactiveGuideLine");
                if (!svgContainer) return;
                svgContainer.on("mousemove", mouseHandler, true).on("mouseout", mouseHandler, true).on("dblclick", mouseHandler);
                layer.renderGuideLine = function(x) {
                    if (!showGuideLine) return;
                    var line = wrap.select(".nv-interactiveGuideLine").selectAll("line").data(null != x ? [ nv.utils.NaNtoZero(x) ] : [], String);
                    line.enter().append("line").attr("class", "nv-guideline").attr("x1", function(d) {
                        return d;
                    }).attr("x2", function(d) {
                        return d;
                    }).attr("y1", availableHeight).attr("y2", 0);
                    line.exit().remove();
                };
            });
        }
        var tooltip = nv.models.tooltip();
        var width = null, height = null, margin = {
            left: 0,
            top: 0
        }, xScale = d3.scale.linear(), dispatch = (d3.scale.linear(), d3.dispatch("elementMousemove", "elementMouseout", "elementDblclick")), showGuideLine = true, svgContainer = null;
        var isMSIE = -1 !== navigator.userAgent.indexOf("MSIE");
        layer.dispatch = dispatch;
        layer.tooltip = tooltip;
        layer.margin = function(_) {
            if (!arguments.length) return margin;
            margin.top = "undefined" != typeof _.top ? _.top : margin.top;
            margin.left = "undefined" != typeof _.left ? _.left : margin.left;
            return layer;
        };
        layer.width = function(_) {
            if (!arguments.length) return width;
            width = _;
            return layer;
        };
        layer.height = function(_) {
            if (!arguments.length) return height;
            height = _;
            return layer;
        };
        layer.xScale = function(_) {
            if (!arguments.length) return xScale;
            xScale = _;
            return layer;
        };
        layer.showGuideLine = function(_) {
            if (!arguments.length) return showGuideLine;
            showGuideLine = _;
            return layer;
        };
        layer.svgContainer = function(_) {
            if (!arguments.length) return svgContainer;
            svgContainer = _;
            return layer;
        };
        return layer;
    };
    nv.interactiveBisect = function(values, searchVal, xAccessor) {
        "use strict";
        if (!values instanceof Array) return null;
        "function" != typeof xAccessor && (xAccessor = function(d) {
            return d.x;
        });
        var bisect = d3.bisector(xAccessor).left;
        var index = d3.max([ 0, bisect(values, searchVal) - 1 ]);
        var currentValue = xAccessor(values[index], index);
        "undefined" == typeof currentValue && (currentValue = index);
        if (currentValue === searchVal) return index;
        var nextIndex = d3.min([ index + 1, values.length - 1 ]);
        var nextValue = xAccessor(values[nextIndex], nextIndex);
        "undefined" == typeof nextValue && (nextValue = nextIndex);
        return Math.abs(nextValue - searchVal) >= Math.abs(currentValue - searchVal) ? index : nextIndex;
    };
    nv.nearestValueIndex = function(values, searchVal, threshold) {
        "use strict";
        var yDistMax = 1/0, indexToHighlight = null;
        values.forEach(function(d, i) {
            var delta = Math.abs(searchVal - d);
            if (yDistMax >= delta && threshold > delta) {
                yDistMax = delta;
                indexToHighlight = i;
            }
        });
        return indexToHighlight;
    };
    (function() {
        "use strict";
        window.nv.tooltip = {};
        window.nv.models.tooltip = function() {
            function convertViewBoxRatio() {
                if (chartContainer) {
                    var svg = d3.select(chartContainer);
                    "svg" !== svg.node().tagName && (svg = svg.select("svg"));
                    var viewBox = svg.node() ? svg.attr("viewBox") : null;
                    if (viewBox) {
                        viewBox = viewBox.split(" ");
                        var ratio = parseInt(svg.style("width")) / viewBox[2];
                        position.left = position.left * ratio;
                        position.top = position.top * ratio;
                    }
                }
            }
            function getTooltipContainer(newContent) {
                var body;
                body = chartContainer ? d3.select(chartContainer) : d3.select("body");
                var container = body.select(".nvtooltip");
                null === container.node() && (container = body.append("div").attr("class", "nvtooltip " + (classes ? classes : "xy-tooltip")).attr("id", id));
                container.node().innerHTML = newContent;
                container.style("top", 0).style("left", 0).style("opacity", 0);
                container.selectAll("div, table, td, tr").classed(nvPointerEventsClass, true);
                container.classed(nvPointerEventsClass, true);
                return container.node();
            }
            function nvtooltip() {
                if (!enabled) return;
                if (!dataSeriesExists(data)) return;
                convertViewBoxRatio();
                var left = position.left;
                var top = null != fixedTop ? fixedTop : position.top;
                var container = getTooltipContainer(contentGenerator(data));
                tooltipElem = container;
                if (chartContainer) {
                    var svgComp = chartContainer.getElementsByTagName("svg")[0];
                    svgComp ? svgComp.getBoundingClientRect() : chartContainer.getBoundingClientRect();
                    var svgOffset = {
                        left: 0,
                        top: 0
                    };
                    if (svgComp) {
                        var svgBound = svgComp.getBoundingClientRect();
                        var chartBound = chartContainer.getBoundingClientRect();
                        var svgBoundTop = svgBound.top;
                        if (0 > svgBoundTop) {
                            var containerBound = chartContainer.getBoundingClientRect();
                            svgBoundTop = Math.abs(svgBoundTop) > containerBound.height ? 0 : svgBoundTop;
                        }
                        svgOffset.top = Math.abs(svgBoundTop - chartBound.top);
                        svgOffset.left = Math.abs(svgBound.left - chartBound.left);
                    }
                    left += chartContainer.offsetLeft + svgOffset.left - 2 * chartContainer.scrollLeft;
                    top += chartContainer.offsetTop + svgOffset.top - 2 * chartContainer.scrollTop;
                }
                snapDistance && snapDistance > 0 && (top = Math.floor(top / snapDistance) * snapDistance);
                nv.tooltip.calcTooltipPosition([ left, top ], gravity, distance, container);
                return nvtooltip;
            }
            var content = null, data = null, gravity = "w", distance = 50, snapDistance = 25, fixedTop = null, classes = null, chartContainer = null, tooltipElem = null, position = {
                left: null,
                top: null
            }, enabled = true, id = "nvtooltip-" + Math.floor(1e5 * Math.random());
            var nvPointerEventsClass = "nv-pointer-events-none";
            var valueFormatter = function(d) {
                return d;
            };
            var headerFormatter = function(d) {
                return d;
            };
            var contentGenerator = function(d) {
                if (null != content) return content;
                if (null == d) return "";
                var table = d3.select(document.createElement("table"));
                var theadEnter = table.selectAll("thead").data([ d ]).enter().append("thead");
                theadEnter.append("tr").append("td").attr("colspan", 3).append("strong").classed("x-value", true).html(headerFormatter(d.value));
                var tbodyEnter = table.selectAll("tbody").data([ d ]).enter().append("tbody");
                var trowEnter = tbodyEnter.selectAll("tr").data(function(p) {
                    return p.series;
                }).enter().append("tr").classed("highlight", function(p) {
                    return p.highlight;
                });
                trowEnter.append("td").classed("legend-color-guide", true).append("div").style("background-color", function(p) {
                    return p.color;
                });
                trowEnter.append("td").classed("key", true).html(function(p) {
                    return p.key;
                });
                trowEnter.append("td").classed("value", true).html(function(p, i) {
                    return valueFormatter(p.value, i);
                });
                trowEnter.selectAll("td").each(function(p) {
                    if (p.highlight) {
                        var opacityScale = d3.scale.linear().domain([ 0, 1 ]).range([ "#fff", p.color ]);
                        var opacity = .6;
                        d3.select(this).style("border-bottom-color", opacityScale(opacity)).style("border-top-color", opacityScale(opacity));
                    }
                });
                var html = table.node().outerHTML;
                void 0 !== d.footer && (html += "<div class='footer'>" + d.footer + "</div>");
                return html;
            };
            var dataSeriesExists = function(d) {
                if (d && d.series && d.series.length > 0) return true;
                return false;
            };
            nvtooltip.nvPointerEventsClass = nvPointerEventsClass;
            nvtooltip.content = function(_) {
                if (!arguments.length) return content;
                content = _;
                return nvtooltip;
            };
            nvtooltip.tooltipElem = function() {
                return tooltipElem;
            };
            nvtooltip.contentGenerator = function(_) {
                if (!arguments.length) return contentGenerator;
                "function" == typeof _ && (contentGenerator = _);
                return nvtooltip;
            };
            nvtooltip.data = function(_) {
                if (!arguments.length) return data;
                data = _;
                return nvtooltip;
            };
            nvtooltip.gravity = function(_) {
                if (!arguments.length) return gravity;
                gravity = _;
                return nvtooltip;
            };
            nvtooltip.distance = function(_) {
                if (!arguments.length) return distance;
                distance = _;
                return nvtooltip;
            };
            nvtooltip.snapDistance = function(_) {
                if (!arguments.length) return snapDistance;
                snapDistance = _;
                return nvtooltip;
            };
            nvtooltip.classes = function(_) {
                if (!arguments.length) return classes;
                classes = _;
                return nvtooltip;
            };
            nvtooltip.chartContainer = function(_) {
                if (!arguments.length) return chartContainer;
                chartContainer = _;
                return nvtooltip;
            };
            nvtooltip.position = function(_) {
                if (!arguments.length) return position;
                position.left = "undefined" != typeof _.left ? _.left : position.left;
                position.top = "undefined" != typeof _.top ? _.top : position.top;
                return nvtooltip;
            };
            nvtooltip.fixedTop = function(_) {
                if (!arguments.length) return fixedTop;
                fixedTop = _;
                return nvtooltip;
            };
            nvtooltip.enabled = function(_) {
                if (!arguments.length) return enabled;
                enabled = _;
                return nvtooltip;
            };
            nvtooltip.valueFormatter = function(_) {
                if (!arguments.length) return valueFormatter;
                "function" == typeof _ && (valueFormatter = _);
                return nvtooltip;
            };
            nvtooltip.headerFormatter = function(_) {
                if (!arguments.length) return headerFormatter;
                "function" == typeof _ && (headerFormatter = _);
                return nvtooltip;
            };
            nvtooltip.id = function() {
                return id;
            };
            return nvtooltip;
        };
        nv.tooltip.show = function(pos, content, gravity, dist, parentContainer, classes) {
            var container = document.createElement("div");
            container.className = "nvtooltip " + (classes ? classes : "xy-tooltip");
            var body = parentContainer;
            (!parentContainer || parentContainer.tagName.match(/g|svg/i)) && (body = document.getElementsByTagName("body")[0]);
            container.style.left = 0;
            container.style.top = 0;
            container.style.opacity = 0;
            container.innerHTML = content;
            body.appendChild(container);
            if (parentContainer) {
                pos[0] = pos[0] - parentContainer.scrollLeft;
                pos[1] = pos[1] - parentContainer.scrollTop;
            }
            nv.tooltip.calcTooltipPosition(pos, gravity, dist, container);
        };
        nv.tooltip.findFirstNonSVGParent = function(Elem) {
            while (null !== Elem.tagName.match(/^g|svg$/i)) Elem = Elem.parentNode;
            return Elem;
        };
        nv.tooltip.findTotalOffsetTop = function(Elem, initialTop) {
            var offsetTop = initialTop;
            do isNaN(Elem.offsetTop) || (offsetTop += Elem.offsetTop); while (Elem = Elem.offsetParent);
            return offsetTop;
        };
        nv.tooltip.findTotalOffsetLeft = function(Elem, initialLeft) {
            var offsetLeft = initialLeft;
            do isNaN(Elem.offsetLeft) || (offsetLeft += Elem.offsetLeft); while (Elem = Elem.offsetParent);
            return offsetLeft;
        };
        nv.tooltip.calcTooltipPosition = function(pos, gravity, dist, container) {
            var left, top, height = parseInt(container.offsetHeight), width = parseInt(container.offsetWidth), windowWidth = nv.utils.windowSize().width, windowHeight = nv.utils.windowSize().height, scrollTop = window.pageYOffset, scrollLeft = window.pageXOffset;
            windowHeight = window.innerWidth >= document.body.scrollWidth ? windowHeight : windowHeight - 16;
            windowWidth = window.innerHeight >= document.body.scrollHeight ? windowWidth : windowWidth - 16;
            gravity = gravity || "s";
            dist = dist || 20;
            var tooltipTop = function(Elem) {
                return nv.tooltip.findTotalOffsetTop(Elem, top);
            };
            var tooltipLeft = function(Elem) {
                return nv.tooltip.findTotalOffsetLeft(Elem, left);
            };
            switch (gravity) {
              case "e":
                left = pos[0] - width - dist;
                top = pos[1] - height / 2;
                var tLeft = tooltipLeft(container);
                var tTop = tooltipTop(container);
                scrollLeft > tLeft && (left = pos[0] + dist > scrollLeft ? pos[0] + dist : scrollLeft - tLeft + left);
                scrollTop > tTop && (top = scrollTop - tTop + top);
                tTop + height > scrollTop + windowHeight && (top = scrollTop + windowHeight - tTop + top - height);
                break;

              case "w":
                left = pos[0] + dist;
                top = pos[1] - height / 2;
                var tLeft = tooltipLeft(container);
                var tTop = tooltipTop(container);
                tLeft + width > windowWidth && (left = pos[0] - width - dist);
                scrollTop > tTop && (top = scrollTop + 5);
                tTop + height > scrollTop + windowHeight && (top = scrollTop + windowHeight - tTop + top - height);
                break;

              case "n":
                left = pos[0] - width / 2 - 5;
                top = pos[1] + dist;
                var tLeft = tooltipLeft(container);
                var tTop = tooltipTop(container);
                scrollLeft > tLeft && (left = scrollLeft + 5);
                tLeft + width > windowWidth && (left = left - width / 2 + 5);
                tTop + height > scrollTop + windowHeight && (top = scrollTop + windowHeight - tTop + top - height);
                break;

              case "s":
                left = pos[0] - width / 2;
                top = pos[1] - height - dist;
                var tLeft = tooltipLeft(container);
                var tTop = tooltipTop(container);
                scrollLeft > tLeft && (left = scrollLeft + 5);
                tLeft + width > windowWidth && (left = left - width / 2 + 5);
                scrollTop > tTop && (top = scrollTop);
                break;

              case "none":
                left = pos[0];
                top = pos[1] - dist;
                var tLeft = tooltipLeft(container);
                var tTop = tooltipTop(container);
            }
            container.style.left = left + "px";
            container.style.top = top + "px";
            container.style.opacity = 1;
            container.style.position = "absolute";
            return container;
        };
        nv.tooltip.cleanup = function() {
            var tooltips = document.getElementsByClassName("nvtooltip");
            var purging = [];
            while (tooltips.length) {
                purging.push(tooltips[0]);
                tooltips[0].style.transitionDelay = "0 !important";
                tooltips[0].style.opacity = 0;
                tooltips[0].className = "nvtooltip-pending-removal";
            }
            setTimeout(function() {
                while (purging.length) {
                    var removeMe = purging.pop();
                    removeMe.parentNode.removeChild(removeMe);
                }
            }, 500);
        };
    })();
    nv.utils.windowSize = function() {
        var size = {
            width: 640,
            height: 480
        };
        if (document.body && document.body.offsetWidth) {
            size.width = document.body.offsetWidth;
            size.height = document.body.offsetHeight;
        }
        if ("CSS1Compat" == document.compatMode && document.documentElement && document.documentElement.offsetWidth) {
            size.width = document.documentElement.offsetWidth;
            size.height = document.documentElement.offsetHeight;
        }
        if (window.innerWidth && window.innerHeight) {
            size.width = window.innerWidth;
            size.height = window.innerHeight;
        }
        return size;
    };
    nv.utils.windowResize = function(fun) {
        if (void 0 === fun) return;
        var oldresize = window.onresize;
        window.onresize = function(e) {
            "function" == typeof oldresize && oldresize(e);
            fun(e);
        };
    };
    nv.utils.getColor = function(color) {
        if (!arguments.length) return nv.utils.defaultColor();
        return "[object Array]" === Object.prototype.toString.call(color) ? function(d, i) {
            return d.color || color[i % color.length];
        } : color;
    };
    nv.utils.defaultColor = function() {
        var colors = d3.scale.category20().range();
        return function(d, i) {
            return d.color || colors[i % colors.length];
        };
    };
    nv.utils.customTheme = function(dictionary, getKey, defaultColors) {
        getKey = getKey || function(series) {
            return series.key;
        };
        defaultColors = defaultColors || d3.scale.category20().range();
        var defIndex = defaultColors.length;
        return function(series) {
            var key = getKey(series);
            defIndex || (defIndex = defaultColors.length);
            return "undefined" != typeof dictionary[key] ? "function" == typeof dictionary[key] ? dictionary[key]() : dictionary[key] : defaultColors[--defIndex];
        };
    };
    nv.utils.pjax = function(links, content) {
        function load(href) {
            d3.html(href, function(fragment) {
                var target = d3.select(content).node();
                target.parentNode.replaceChild(d3.select(fragment).select(content).node(), target);
                nv.utils.pjax(links, content);
            });
        }
        d3.selectAll(links).on("click", function() {
            history.pushState(this.href, this.textContent, this.href);
            load(this.href);
            d3.event.preventDefault();
        });
        d3.select(window).on("popstate", function() {
            d3.event.state && load(d3.event.state);
        });
    };
    nv.utils.calcApproxTextWidth = function(svgTextElem) {
        if ("function" == typeof svgTextElem.style && "function" == typeof svgTextElem.text) {
            var fontSize = parseInt(svgTextElem.style("font-size").replace("px", ""));
            var textLength = svgTextElem.text().length;
            return .5 * textLength * fontSize;
        }
        return 0;
    };
    nv.utils.NaNtoZero = function(n) {
        if ("number" != typeof n || isNaN(n) || null === n || 1/0 === n) return 0;
        return n;
    };
    nv.utils.optionsFunc = function(args) {
        args && d3.map(args).forEach(function(key, value) {
            "function" == typeof this[key] && this[key](value);
        }.bind(this));
        return this;
    };
    nv.models.axis = function() {
        "use strict";
        function chart(selection) {
            selection.each(function(data) {
                var container = d3.select(this);
                var wrap = container.selectAll("g.nv-wrap.nv-axis").data([ data ]);
                var wrapEnter = wrap.enter().append("g").attr("class", "nvd3 nv-wrap nv-axis");
                wrapEnter.append("g");
                var g = wrap.select("g");
                null !== ticks ? axis.ticks(ticks) : ("top" == axis.orient() || "bottom" == axis.orient()) && axis.ticks(Math.abs(scale.range()[1] - scale.range()[0]) / 100);
                g.transition().call(axis);
                scale0 = scale0 || axis.scale();
                var fmt = axis.tickFormat();
                null == fmt && (fmt = scale0.tickFormat());
                var axisLabel = g.selectAll("text.nv-axislabel").data([ axisLabelText || null ]);
                axisLabel.exit().remove();
                switch (axis.orient()) {
                  case "top":
                    axisLabel.enter().append("text").attr("class", "nv-axislabel");
                    var w = 2 == scale.range().length ? scale.range()[1] : scale.range()[scale.range().length - 1] + (scale.range()[1] - scale.range()[0]);
                    axisLabel.attr("text-anchor", "middle").attr("y", 0).attr("x", w / 2);
                    if (showMaxMin) {
                        var axisMaxMin = wrap.selectAll("g.nv-axisMaxMin").data(scale.domain());
                        axisMaxMin.enter().append("g").attr("class", "nv-axisMaxMin").append("text");
                        axisMaxMin.exit().remove();
                        axisMaxMin.attr("transform", function(d) {
                            return "translate(" + scale(d) + ",0)";
                        }).select("text").attr("dy", "-0.5em").attr("y", -axis.tickPadding()).attr("text-anchor", "middle").text(function(d) {
                            var v = fmt(d);
                            return ("" + v).match("NaN") ? "" : v;
                        });
                        axisMaxMin.transition().attr("transform", function(d, i) {
                            return "translate(" + scale.range()[i] + ",0)";
                        });
                    }
                    break;

                  case "bottom":
                    var xLabelMargin = 36;
                    var maxTextWidth = 30;
                    var xTicks = g.selectAll("g").select("text");
                    if (rotateLabels % 360) {
                        xTicks.each(function() {
                            var width = this.getBBox().width;
                            width > maxTextWidth && (maxTextWidth = width);
                        });
                        var sin = Math.abs(Math.sin(rotateLabels * Math.PI / 180));
                        var xLabelMargin = (sin ? sin * maxTextWidth : maxTextWidth) + 30;
                        xTicks.attr("transform", function() {
                            return "rotate(" + rotateLabels + " 0,0)";
                        }).style("text-anchor", rotateLabels % 360 > 0 ? "start" : "end");
                    }
                    axisLabel.enter().append("text").attr("class", "nv-axislabel");
                    var w = 2 == scale.range().length ? scale.range()[1] : scale.range()[scale.range().length - 1] + (scale.range()[1] - scale.range()[0]);
                    axisLabel.attr("text-anchor", "middle").attr("y", xLabelMargin).attr("x", w / 2);
                    if (showMaxMin) {
                        var axisMaxMin = wrap.selectAll("g.nv-axisMaxMin").data([ scale.domain()[0], scale.domain()[scale.domain().length - 1] ]);
                        axisMaxMin.enter().append("g").attr("class", "nv-axisMaxMin").append("text");
                        axisMaxMin.exit().remove();
                        axisMaxMin.attr("transform", function(d) {
                            return "translate(" + (scale(d) + (isOrdinal ? scale.rangeBand() / 2 : 0)) + ",0)";
                        }).select("text").attr("dy", ".71em").attr("y", axis.tickPadding()).attr("transform", function() {
                            return "rotate(" + rotateLabels + " 0,0)";
                        }).style("text-anchor", rotateLabels ? rotateLabels % 360 > 0 ? "start" : "end" : "middle").text(function(d) {
                            var v = fmt(d);
                            return ("" + v).match("NaN") ? "" : v;
                        });
                        axisMaxMin.transition().attr("transform", function(d) {
                            return "translate(" + (scale(d) + (isOrdinal ? scale.rangeBand() / 2 : 0)) + ",0)";
                        });
                    }
                    staggerLabels && xTicks.attr("transform", function(d, i) {
                        return "translate(0," + (0 == i % 2 ? "0" : "12") + ")";
                    });
                    break;

                  case "right":
                    axisLabel.enter().append("text").attr("class", "nv-axislabel");
                    axisLabel.style("text-anchor", rotateYLabel ? "middle" : "begin").attr("transform", rotateYLabel ? "rotate(90)" : "").attr("y", rotateYLabel ? -Math.max(margin.right, width) + 12 : -10).attr("x", rotateYLabel ? scale.range()[0] / 2 : axis.tickPadding());
                    if (showMaxMin) {
                        var axisMaxMin = wrap.selectAll("g.nv-axisMaxMin").data(scale.domain());
                        axisMaxMin.enter().append("g").attr("class", "nv-axisMaxMin").append("text").style("opacity", 0);
                        axisMaxMin.exit().remove();
                        axisMaxMin.attr("transform", function(d) {
                            return "translate(0," + scale(d) + ")";
                        }).select("text").attr("dy", ".32em").attr("y", 0).attr("x", axis.tickPadding()).style("text-anchor", "start").text(function(d) {
                            var v = fmt(d);
                            return ("" + v).match("NaN") ? "" : v;
                        });
                        axisMaxMin.transition().attr("transform", function(d, i) {
                            return "translate(0," + scale.range()[i] + ")";
                        }).select("text").style("opacity", 1);
                    }
                    break;

                  case "left":
                    axisLabel.enter().append("text").attr("class", "nv-axislabel");
                    axisLabel.style("text-anchor", rotateYLabel ? "middle" : "end").attr("transform", rotateYLabel ? "rotate(-90)" : "").attr("y", rotateYLabel ? -Math.max(margin.left, width) + axisLabelDistance : -10).attr("x", rotateYLabel ? -scale.range()[0] / 2 : -axis.tickPadding());
                    if (showMaxMin) {
                        var axisMaxMin = wrap.selectAll("g.nv-axisMaxMin").data(scale.domain());
                        axisMaxMin.enter().append("g").attr("class", "nv-axisMaxMin").append("text").style("opacity", 0);
                        axisMaxMin.exit().remove();
                        axisMaxMin.attr("transform", function(d) {
                            return "translate(0," + scale0(d) + ")";
                        }).select("text").attr("dy", ".32em").attr("y", 0).attr("x", -axis.tickPadding()).attr("text-anchor", "end").text(function(d) {
                            var v = fmt(d);
                            return ("" + v).match("NaN") ? "" : v;
                        });
                        axisMaxMin.transition().attr("transform", function(d, i) {
                            return "translate(0," + scale.range()[i] + ")";
                        }).select("text").style("opacity", 1);
                    }
                }
                axisLabel.text(function(d) {
                    return d;
                });
                if (showMaxMin && ("left" === axis.orient() || "right" === axis.orient())) {
                    g.selectAll("g").each(function(d) {
                        d3.select(this).select("text").attr("opacity", 1);
                        if (scale(d) < scale.range()[1] + 10 || scale(d) > scale.range()[0] - 10) {
                            (d > 1e-10 || -1e-10 > d) && d3.select(this).attr("opacity", 0);
                            d3.select(this).select("text").attr("opacity", 0);
                        }
                    });
                    scale.domain()[0] == scale.domain()[1] && 0 == scale.domain()[0] && wrap.selectAll("g.nv-axisMaxMin").style("opacity", function(d, i) {
                        return i ? 0 : 1;
                    });
                }
                if (showMaxMin && ("top" === axis.orient() || "bottom" === axis.orient())) {
                    var maxMinRange = [];
                    wrap.selectAll("g.nv-axisMaxMin").each(function(d, i) {
                        try {
                            i ? maxMinRange.push(scale(d) - this.getBBox().width - 4) : maxMinRange.push(scale(d) + this.getBBox().width + 4);
                        } catch (err) {
                            i ? maxMinRange.push(scale(d) - 4) : maxMinRange.push(scale(d) + 4);
                        }
                    });
                    g.selectAll("g").each(function(d) {
                        (scale(d) < maxMinRange[0] || scale(d) > maxMinRange[1]) && (d > 1e-10 || -1e-10 > d ? d3.select(this).remove() : d3.select(this).select("text").remove());
                    });
                }
                highlightZero && g.selectAll(".tick").filter(function(d) {
                    return !parseFloat(Math.round(1e5 * d.__data__) / 1e6) && void 0 !== d.__data__;
                }).classed("zero", true);
                scale0 = scale.copy();
            });
            return chart;
        }
        var axis = d3.svg.axis();
        var margin = {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        }, width = 75, height = 60, scale = d3.scale.linear(), axisLabelText = null, showMaxMin = true, highlightZero = true, rotateLabels = 0, rotateYLabel = true, staggerLabels = false, isOrdinal = false, ticks = null, axisLabelDistance = 12;
        axis.scale(scale).orient("bottom").tickFormat(function(d) {
            return d;
        });
        var scale0;
        chart.axis = axis;
        d3.rebind(chart, axis, "orient", "tickValues", "tickSubdivide", "tickSize", "tickPadding", "tickFormat");
        d3.rebind(chart, scale, "domain", "range", "rangeBand", "rangeBands");
        chart.options = nv.utils.optionsFunc.bind(chart);
        chart.margin = function(_) {
            if (!arguments.length) return margin;
            margin.top = "undefined" != typeof _.top ? _.top : margin.top;
            margin.right = "undefined" != typeof _.right ? _.right : margin.right;
            margin.bottom = "undefined" != typeof _.bottom ? _.bottom : margin.bottom;
            margin.left = "undefined" != typeof _.left ? _.left : margin.left;
            return chart;
        };
        chart.width = function(_) {
            if (!arguments.length) return width;
            width = _;
            return chart;
        };
        chart.ticks = function(_) {
            if (!arguments.length) return ticks;
            ticks = _;
            return chart;
        };
        chart.height = function(_) {
            if (!arguments.length) return height;
            height = _;
            return chart;
        };
        chart.axisLabel = function(_) {
            if (!arguments.length) return axisLabelText;
            axisLabelText = _;
            return chart;
        };
        chart.showMaxMin = function(_) {
            if (!arguments.length) return showMaxMin;
            showMaxMin = _;
            return chart;
        };
        chart.highlightZero = function(_) {
            if (!arguments.length) return highlightZero;
            highlightZero = _;
            return chart;
        };
        chart.scale = function(_) {
            if (!arguments.length) return scale;
            scale = _;
            axis.scale(scale);
            isOrdinal = "function" == typeof scale.rangeBands;
            d3.rebind(chart, scale, "domain", "range", "rangeBand", "rangeBands");
            return chart;
        };
        chart.rotateYLabel = function(_) {
            if (!arguments.length) return rotateYLabel;
            rotateYLabel = _;
            return chart;
        };
        chart.rotateLabels = function(_) {
            if (!arguments.length) return rotateLabels;
            rotateLabels = _;
            return chart;
        };
        chart.staggerLabels = function(_) {
            if (!arguments.length) return staggerLabels;
            staggerLabels = _;
            return chart;
        };
        chart.axisLabelDistance = function(_) {
            if (!arguments.length) return axisLabelDistance;
            axisLabelDistance = _;
            return chart;
        };
        return chart;
    };
    nv.models.historicalBar = function() {
        "use strict";
        function chart(selection) {
            selection.each(function(data) {
                var availableWidth = width - margin.left - margin.right, availableHeight = height - margin.top - margin.bottom, container = d3.select(this);
                x.domain(xDomain || d3.extent(data[0].values.map(getX).concat(forceX)));
                padData ? x.range(xRange || [ .5 * availableWidth / data[0].values.length, availableWidth * (data[0].values.length - .5) / data[0].values.length ]) : x.range(xRange || [ 0, availableWidth ]);
                y.domain(yDomain || d3.extent(data[0].values.map(getY).concat(forceY))).range(yRange || [ availableHeight, 0 ]);
                x.domain()[0] === x.domain()[1] && (x.domain()[0] ? x.domain([ x.domain()[0] - .01 * x.domain()[0], x.domain()[1] + .01 * x.domain()[1] ]) : x.domain([ -1, 1 ]));
                y.domain()[0] === y.domain()[1] && (y.domain()[0] ? y.domain([ y.domain()[0] + .01 * y.domain()[0], y.domain()[1] - .01 * y.domain()[1] ]) : y.domain([ -1, 1 ]));
                var wrap = container.selectAll("g.nv-wrap.nv-historicalBar-" + id).data([ data[0].values ]);
                var wrapEnter = wrap.enter().append("g").attr("class", "nvd3 nv-wrap nv-historicalBar-" + id);
                var defsEnter = wrapEnter.append("defs");
                var gEnter = wrapEnter.append("g");
                var g = wrap.select("g");
                gEnter.append("g").attr("class", "nv-bars");
                wrap.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                container.on("click", function(d, i) {
                    dispatch.chartClick({
                        data: d,
                        index: i,
                        pos: d3.event,
                        id: id
                    });
                });
                defsEnter.append("clipPath").attr("id", "nv-chart-clip-path-" + id).append("rect");
                wrap.select("#nv-chart-clip-path-" + id + " rect").attr("width", availableWidth).attr("height", availableHeight);
                g.attr("clip-path", clipEdge ? "url(#nv-chart-clip-path-" + id + ")" : "");
                var bars = wrap.select(".nv-bars").selectAll(".nv-bar").data(function(d) {
                    return d;
                }, function(d, i) {
                    return getX(d, i);
                });
                bars.exit().remove();
                bars.enter().append("rect").attr("x", 0).attr("y", function(d, i) {
                    return nv.utils.NaNtoZero(y(Math.max(0, getY(d, i))));
                }).attr("height", function(d, i) {
                    return nv.utils.NaNtoZero(Math.abs(y(getY(d, i)) - y(0)));
                }).attr("transform", function(d, i) {
                    return "translate(" + (x(getX(d, i)) - .45 * (availableWidth / data[0].values.length)) + ",0)";
                }).on("mouseover", function(d, i) {
                    if (!interactive) return;
                    d3.select(this).classed("hover", true);
                    dispatch.elementMouseover({
                        point: d,
                        series: data[0],
                        pos: [ x(getX(d, i)), y(getY(d, i)) ],
                        pointIndex: i,
                        seriesIndex: 0,
                        e: d3.event
                    });
                }).on("mouseout", function(d, i) {
                    if (!interactive) return;
                    d3.select(this).classed("hover", false);
                    dispatch.elementMouseout({
                        point: d,
                        series: data[0],
                        pointIndex: i,
                        seriesIndex: 0,
                        e: d3.event
                    });
                }).on("click", function(d, i) {
                    if (!interactive) return;
                    dispatch.elementClick({
                        value: getY(d, i),
                        data: d,
                        index: i,
                        pos: [ x(getX(d, i)), y(getY(d, i)) ],
                        e: d3.event,
                        id: id
                    });
                    d3.event.stopPropagation();
                }).on("dblclick", function(d, i) {
                    if (!interactive) return;
                    dispatch.elementDblClick({
                        value: getY(d, i),
                        data: d,
                        index: i,
                        pos: [ x(getX(d, i)), y(getY(d, i)) ],
                        e: d3.event,
                        id: id
                    });
                    d3.event.stopPropagation();
                });
                bars.attr("fill", function(d, i) {
                    return color(d, i);
                }).attr("class", function(d, i, j) {
                    return (0 > getY(d, i) ? "nv-bar negative" : "nv-bar positive") + " nv-bar-" + j + "-" + i;
                }).transition().attr("transform", function(d, i) {
                    return "translate(" + (x(getX(d, i)) - .45 * (availableWidth / data[0].values.length)) + ",0)";
                }).attr("width", .9 * (availableWidth / data[0].values.length));
                bars.transition().attr("y", function(d, i) {
                    var rval = 0 > getY(d, i) ? y(0) : 1 > y(0) - y(getY(d, i)) ? y(0) - 1 : y(getY(d, i));
                    return nv.utils.NaNtoZero(rval);
                }).attr("height", function(d, i) {
                    return nv.utils.NaNtoZero(Math.max(Math.abs(y(getY(d, i)) - y(0)), 1));
                });
            });
            return chart;
        }
        var xDomain, yDomain, xRange, yRange, margin = {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        }, width = 960, height = 500, id = Math.floor(1e4 * Math.random()), x = d3.scale.linear(), y = d3.scale.linear(), getX = function(d) {
            return d.x;
        }, getY = function(d) {
            return d.y;
        }, forceX = [], forceY = [ 0 ], padData = false, clipEdge = true, color = nv.utils.defaultColor(), dispatch = d3.dispatch("chartClick", "elementClick", "elementDblClick", "elementMouseover", "elementMouseout"), interactive = true;
        chart.highlightPoint = function(pointIndex, isHoverOver) {
            d3.select(".nv-historicalBar-" + id).select(".nv-bars .nv-bar-0-" + pointIndex).classed("hover", isHoverOver);
        };
        chart.clearHighlights = function() {
            d3.select(".nv-historicalBar-" + id).select(".nv-bars .nv-bar.hover").classed("hover", false);
        };
        chart.dispatch = dispatch;
        chart.options = nv.utils.optionsFunc.bind(chart);
        chart.x = function(_) {
            if (!arguments.length) return getX;
            getX = _;
            return chart;
        };
        chart.y = function(_) {
            if (!arguments.length) return getY;
            getY = _;
            return chart;
        };
        chart.margin = function(_) {
            if (!arguments.length) return margin;
            margin.top = "undefined" != typeof _.top ? _.top : margin.top;
            margin.right = "undefined" != typeof _.right ? _.right : margin.right;
            margin.bottom = "undefined" != typeof _.bottom ? _.bottom : margin.bottom;
            margin.left = "undefined" != typeof _.left ? _.left : margin.left;
            return chart;
        };
        chart.width = function(_) {
            if (!arguments.length) return width;
            width = _;
            return chart;
        };
        chart.height = function(_) {
            if (!arguments.length) return height;
            height = _;
            return chart;
        };
        chart.xScale = function(_) {
            if (!arguments.length) return x;
            x = _;
            return chart;
        };
        chart.yScale = function(_) {
            if (!arguments.length) return y;
            y = _;
            return chart;
        };
        chart.xDomain = function(_) {
            if (!arguments.length) return xDomain;
            xDomain = _;
            return chart;
        };
        chart.yDomain = function(_) {
            if (!arguments.length) return yDomain;
            yDomain = _;
            return chart;
        };
        chart.xRange = function(_) {
            if (!arguments.length) return xRange;
            xRange = _;
            return chart;
        };
        chart.yRange = function(_) {
            if (!arguments.length) return yRange;
            yRange = _;
            return chart;
        };
        chart.forceX = function(_) {
            if (!arguments.length) return forceX;
            forceX = _;
            return chart;
        };
        chart.forceY = function(_) {
            if (!arguments.length) return forceY;
            forceY = _;
            return chart;
        };
        chart.padData = function(_) {
            if (!arguments.length) return padData;
            padData = _;
            return chart;
        };
        chart.clipEdge = function(_) {
            if (!arguments.length) return clipEdge;
            clipEdge = _;
            return chart;
        };
        chart.color = function(_) {
            if (!arguments.length) return color;
            color = nv.utils.getColor(_);
            return chart;
        };
        chart.id = function(_) {
            if (!arguments.length) return id;
            id = _;
            return chart;
        };
        chart.interactive = function() {
            if (!arguments.length) return interactive;
            interactive = false;
            return chart;
        };
        return chart;
    };
    nv.models.bullet = function() {
        "use strict";
        function chart(selection) {
            selection.each(function(d, i) {
                var availableWidth = width - margin.left - margin.right, availableHeight = height - margin.top - margin.bottom, container = d3.select(this);
                var rangez = ranges.call(this, d, i).slice().sort(d3.descending), markerz = markers.call(this, d, i).slice().sort(d3.descending), measurez = measures.call(this, d, i).slice().sort(d3.descending), rangeLabelz = rangeLabels.call(this, d, i).slice(), markerLabelz = markerLabels.call(this, d, i).slice(), measureLabelz = measureLabels.call(this, d, i).slice();
                var x1 = d3.scale.linear().domain(d3.extent(d3.merge([ forceX, rangez ]))).range(reverse ? [ availableWidth, 0 ] : [ 0, availableWidth ]);
                this.__chart__ || d3.scale.linear().domain([ 0, 1/0 ]).range(x1.range());
                this.__chart__ = x1;
                var rangeMin = d3.min(rangez), rangeMax = d3.max(rangez), rangeAvg = rangez[1];
                var wrap = container.selectAll("g.nv-wrap.nv-bullet").data([ d ]);
                var wrapEnter = wrap.enter().append("g").attr("class", "nvd3 nv-wrap nv-bullet");
                var gEnter = wrapEnter.append("g");
                var g = wrap.select("g");
                gEnter.append("rect").attr("class", "nv-range nv-rangeMax");
                gEnter.append("rect").attr("class", "nv-range nv-rangeAvg");
                gEnter.append("rect").attr("class", "nv-range nv-rangeMin");
                gEnter.append("rect").attr("class", "nv-measure");
                gEnter.append("path").attr("class", "nv-markerTriangle");
                wrap.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                var w1 = function(d) {
                    return Math.abs(x1(d) - x1(0));
                };
                var xp1 = function(d) {
                    return 0 > d ? x1(d) : x1(0);
                };
                g.select("rect.nv-rangeMax").attr("height", availableHeight).attr("width", w1(rangeMax > 0 ? rangeMax : rangeMin)).attr("x", xp1(rangeMax > 0 ? rangeMax : rangeMin)).datum(rangeMax > 0 ? rangeMax : rangeMin);
                g.select("rect.nv-rangeAvg").attr("height", availableHeight).attr("width", w1(rangeAvg)).attr("x", xp1(rangeAvg)).datum(rangeAvg);
                g.select("rect.nv-rangeMin").attr("height", availableHeight).attr("width", w1(rangeMax)).attr("x", xp1(rangeMax)).attr("width", w1(rangeMax > 0 ? rangeMin : rangeMax)).attr("x", xp1(rangeMax > 0 ? rangeMin : rangeMax)).datum(rangeMax > 0 ? rangeMin : rangeMax);
                g.select("rect.nv-measure").style("fill", color).attr("height", availableHeight / 3).attr("y", availableHeight / 3).attr("width", 0 > measurez ? x1(0) - x1(measurez[0]) : x1(measurez[0]) - x1(0)).attr("x", xp1(measurez)).on("mouseover", function() {
                    dispatch.elementMouseover({
                        value: measurez[0],
                        label: measureLabelz[0] || "Current",
                        pos: [ x1(measurez[0]), availableHeight / 2 ]
                    });
                }).on("mouseout", function() {
                    dispatch.elementMouseout({
                        value: measurez[0],
                        label: measureLabelz[0] || "Current"
                    });
                });
                var h3 = availableHeight / 6;
                markerz[0] ? g.selectAll("path.nv-markerTriangle").attr("transform", function() {
                    return "translate(" + x1(markerz[0]) + "," + availableHeight / 2 + ")";
                }).attr("d", "M0," + h3 + "L" + h3 + "," + -h3 + " " + -h3 + "," + -h3 + "Z").on("mouseover", function() {
                    dispatch.elementMouseover({
                        value: markerz[0],
                        label: markerLabelz[0] || "Previous",
                        pos: [ x1(markerz[0]), availableHeight / 2 ]
                    });
                }).on("mouseout", function() {
                    dispatch.elementMouseout({
                        value: markerz[0],
                        label: markerLabelz[0] || "Previous"
                    });
                }) : g.selectAll("path.nv-markerTriangle").remove();
                wrap.selectAll(".nv-range").on("mouseover", function(d, i) {
                    var label = rangeLabelz[i] || (i ? 1 == i ? "Mean" : "Minimum" : "Maximum");
                    dispatch.elementMouseover({
                        value: d,
                        label: label,
                        pos: [ x1(d), availableHeight / 2 ]
                    });
                }).on("mouseout", function(d, i) {
                    var label = rangeLabelz[i] || (i ? 1 == i ? "Mean" : "Minimum" : "Maximum");
                    dispatch.elementMouseout({
                        value: d,
                        label: label
                    });
                });
            });
            return chart;
        }
        var margin = {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        }, orient = "left", reverse = false, ranges = function(d) {
            return d.ranges;
        }, markers = function(d) {
            return d.markers;
        }, measures = function(d) {
            return d.measures;
        }, rangeLabels = function(d) {
            return d.rangeLabels ? d.rangeLabels : [];
        }, markerLabels = function(d) {
            return d.markerLabels ? d.markerLabels : [];
        }, measureLabels = function(d) {
            return d.measureLabels ? d.measureLabels : [];
        }, forceX = [ 0 ], width = 380, height = 30, tickFormat = null, color = nv.utils.getColor([ "#1f77b4" ]), dispatch = d3.dispatch("elementMouseover", "elementMouseout");
        chart.dispatch = dispatch;
        chart.options = nv.utils.optionsFunc.bind(chart);
        chart.orient = function(_) {
            if (!arguments.length) return orient;
            orient = _;
            reverse = "right" == orient || "bottom" == orient;
            return chart;
        };
        chart.ranges = function(_) {
            if (!arguments.length) return ranges;
            ranges = _;
            return chart;
        };
        chart.markers = function(_) {
            if (!arguments.length) return markers;
            markers = _;
            return chart;
        };
        chart.measures = function(_) {
            if (!arguments.length) return measures;
            measures = _;
            return chart;
        };
        chart.forceX = function(_) {
            if (!arguments.length) return forceX;
            forceX = _;
            return chart;
        };
        chart.width = function(_) {
            if (!arguments.length) return width;
            width = _;
            return chart;
        };
        chart.height = function(_) {
            if (!arguments.length) return height;
            height = _;
            return chart;
        };
        chart.margin = function(_) {
            if (!arguments.length) return margin;
            margin.top = "undefined" != typeof _.top ? _.top : margin.top;
            margin.right = "undefined" != typeof _.right ? _.right : margin.right;
            margin.bottom = "undefined" != typeof _.bottom ? _.bottom : margin.bottom;
            margin.left = "undefined" != typeof _.left ? _.left : margin.left;
            return chart;
        };
        chart.tickFormat = function(_) {
            if (!arguments.length) return tickFormat;
            tickFormat = _;
            return chart;
        };
        chart.color = function(_) {
            if (!arguments.length) return color;
            color = nv.utils.getColor(_);
            return chart;
        };
        return chart;
    };
    nv.models.bulletChart = function() {
        "use strict";
        function chart(selection) {
            selection.each(function(d, i) {
                var container = d3.select(this);
                var availableWidth = (width || parseInt(container.style("width")) || 960) - margin.left - margin.right, availableHeight = height - margin.top - margin.bottom, that = this;
                chart.update = function() {
                    chart(selection);
                };
                chart.container = this;
                if (!d || !ranges.call(this, d, i)) {
                    var noDataText = container.selectAll(".nv-noData").data([ noData ]);
                    noDataText.enter().append("text").attr("class", "nvd3 nv-noData").attr("dy", "-.7em").style("text-anchor", "middle");
                    noDataText.attr("x", margin.left + availableWidth / 2).attr("y", 18 + margin.top + availableHeight / 2).text(function(d) {
                        return d;
                    });
                    return chart;
                }
                container.selectAll(".nv-noData").remove();
                var rangez = ranges.call(this, d, i).slice().sort(d3.descending), markerz = markers.call(this, d, i).slice().sort(d3.descending), measurez = measures.call(this, d, i).slice().sort(d3.descending);
                var wrap = container.selectAll("g.nv-wrap.nv-bulletChart").data([ d ]);
                var wrapEnter = wrap.enter().append("g").attr("class", "nvd3 nv-wrap nv-bulletChart");
                var gEnter = wrapEnter.append("g");
                var g = wrap.select("g");
                gEnter.append("g").attr("class", "nv-bulletWrap");
                gEnter.append("g").attr("class", "nv-titles");
                wrap.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                var x1 = d3.scale.linear().domain([ 0, Math.max(rangez[0], markerz[0], measurez[0]) ]).range(reverse ? [ availableWidth, 0 ] : [ 0, availableWidth ]);
                var x0 = this.__chart__ || d3.scale.linear().domain([ 0, 1/0 ]).range(x1.range());
                this.__chart__ = x1;
                var title = gEnter.select(".nv-titles").append("g").attr("text-anchor", "end").attr("transform", "translate(-6," + (height - margin.top - margin.bottom) / 2 + ")");
                title.append("text").attr("class", "nv-title").text(function(d) {
                    return d.title;
                });
                title.append("text").attr("class", "nv-subtitle").attr("dy", "1em").text(function(d) {
                    return d.subtitle;
                });
                bullet.width(availableWidth).height(availableHeight);
                var bulletWrap = g.select(".nv-bulletWrap");
                d3.transition(bulletWrap).call(bullet);
                var format = tickFormat || x1.tickFormat(availableWidth / 100);
                var tick = g.selectAll("g.nv-tick").data(x1.ticks(availableWidth / 50), function(d) {
                    return this.textContent || format(d);
                });
                var tickEnter = tick.enter().append("g").attr("class", "nv-tick").attr("transform", function(d) {
                    return "translate(" + x0(d) + ",0)";
                }).style("opacity", 1e-6);
                tickEnter.append("line").attr("y1", availableHeight).attr("y2", 7 * availableHeight / 6);
                tickEnter.append("text").attr("text-anchor", "middle").attr("dy", "1em").attr("y", 7 * availableHeight / 6).text(format);
                var tickUpdate = d3.transition(tick).attr("transform", function(d) {
                    return "translate(" + x1(d) + ",0)";
                }).style("opacity", 1);
                tickUpdate.select("line").attr("y1", availableHeight).attr("y2", 7 * availableHeight / 6);
                tickUpdate.select("text").attr("y", 7 * availableHeight / 6);
                d3.transition(tick.exit()).attr("transform", function(d) {
                    return "translate(" + x1(d) + ",0)";
                }).style("opacity", 1e-6).remove();
                dispatch.on("tooltipShow", function(e) {
                    e.key = d.title;
                    tooltips && showTooltip(e, that.parentNode);
                });
            });
            d3.timer.flush();
            return chart;
        }
        var bullet = nv.models.bullet();
        var orient = "left", reverse = false, margin = {
            top: 5,
            right: 40,
            bottom: 20,
            left: 120
        }, ranges = function(d) {
            return d.ranges;
        }, markers = function(d) {
            return d.markers;
        }, measures = function(d) {
            return d.measures;
        }, width = null, height = 55, tickFormat = null, tooltips = true, tooltip = function(key, x, y) {
            return "<h3>" + x + "</h3>" + "<p>" + y + "</p>";
        }, noData = "No Data Available.", dispatch = d3.dispatch("tooltipShow", "tooltipHide");
        var showTooltip = function(e, offsetElement) {
            var left = e.pos[0] + (offsetElement.offsetLeft || 0) + margin.left, top = e.pos[1] + (offsetElement.offsetTop || 0) + margin.top, content = tooltip(e.key, e.label, e.value, e, chart);
            nv.tooltip.show([ left, top ], content, 0 > e.value ? "e" : "w", null, offsetElement);
        };
        bullet.dispatch.on("elementMouseover.tooltip", function(e) {
            dispatch.tooltipShow(e);
        });
        bullet.dispatch.on("elementMouseout.tooltip", function(e) {
            dispatch.tooltipHide(e);
        });
        dispatch.on("tooltipHide", function() {
            tooltips && nv.tooltip.cleanup();
        });
        chart.dispatch = dispatch;
        chart.bullet = bullet;
        d3.rebind(chart, bullet, "color");
        chart.options = nv.utils.optionsFunc.bind(chart);
        chart.orient = function(x) {
            if (!arguments.length) return orient;
            orient = x;
            reverse = "right" == orient || "bottom" == orient;
            return chart;
        };
        chart.ranges = function(x) {
            if (!arguments.length) return ranges;
            ranges = x;
            return chart;
        };
        chart.markers = function(x) {
            if (!arguments.length) return markers;
            markers = x;
            return chart;
        };
        chart.measures = function(x) {
            if (!arguments.length) return measures;
            measures = x;
            return chart;
        };
        chart.width = function(x) {
            if (!arguments.length) return width;
            width = x;
            return chart;
        };
        chart.height = function(x) {
            if (!arguments.length) return height;
            height = x;
            return chart;
        };
        chart.margin = function(_) {
            if (!arguments.length) return margin;
            margin.top = "undefined" != typeof _.top ? _.top : margin.top;
            margin.right = "undefined" != typeof _.right ? _.right : margin.right;
            margin.bottom = "undefined" != typeof _.bottom ? _.bottom : margin.bottom;
            margin.left = "undefined" != typeof _.left ? _.left : margin.left;
            return chart;
        };
        chart.tickFormat = function(x) {
            if (!arguments.length) return tickFormat;
            tickFormat = x;
            return chart;
        };
        chart.tooltips = function(_) {
            if (!arguments.length) return tooltips;
            tooltips = _;
            return chart;
        };
        chart.tooltipContent = function(_) {
            if (!arguments.length) return tooltip;
            tooltip = _;
            return chart;
        };
        chart.noData = function(_) {
            if (!arguments.length) return noData;
            noData = _;
            return chart;
        };
        return chart;
    };
    nv.models.cumulativeLineChart = function() {
        "use strict";
        function chart(selection) {
            selection.each(function(data) {
                function dragStart() {
                    d3.select(chart.container).style("cursor", "ew-resize");
                }
                function dragMove() {
                    index.x = d3.event.x;
                    index.i = Math.round(dx.invert(index.x));
                    updateZero();
                }
                function dragEnd() {
                    d3.select(chart.container).style("cursor", "auto");
                    state.index = index.i;
                    dispatch.stateChange(state);
                }
                function updateZero() {
                    indexLine.data([ index ]);
                    var oldDuration = chart.transitionDuration();
                    chart.transitionDuration(0);
                    chart.update();
                    chart.transitionDuration(oldDuration);
                }
                var container = d3.select(this).classed("nv-chart-" + id, true), that = this;
                var availableWidth = (width || parseInt(container.style("width")) || 960) - margin.left - margin.right, availableHeight = (height || parseInt(container.style("height")) || 400) - margin.top - margin.bottom;
                chart.update = function() {
                    container.transition().duration(transitionDuration).call(chart);
                };
                chart.container = this;
                state.disabled = data.map(function(d) {
                    return !!d.disabled;
                });
                if (!defaultState) {
                    var key;
                    defaultState = {};
                    for (key in state) defaultState[key] = state[key] instanceof Array ? state[key].slice(0) : state[key];
                }
                var indexDrag = d3.behavior.drag().on("dragstart", dragStart).on("drag", dragMove).on("dragend", dragEnd);
                if (!(data && data.length && data.filter(function(d) {
                    return d.values.length;
                }).length)) {
                    var noDataText = container.selectAll(".nv-noData").data([ noData ]);
                    noDataText.enter().append("text").attr("class", "nvd3 nv-noData").attr("dy", "-.7em").style("text-anchor", "middle");
                    noDataText.attr("x", margin.left + availableWidth / 2).attr("y", margin.top + availableHeight / 2).text(function(d) {
                        return d;
                    });
                    return chart;
                }
                container.selectAll(".nv-noData").remove();
                x = lines.xScale();
                y = lines.yScale();
                if (rescaleY) lines.yDomain(null); else {
                    var seriesDomains = data.filter(function(series) {
                        return !series.disabled;
                    }).map(function(series) {
                        var initialDomain = d3.extent(series.values, lines.y());
                        -.95 > initialDomain[0] && (initialDomain[0] = -.95);
                        return [ (initialDomain[0] - initialDomain[1]) / (1 + initialDomain[1]), (initialDomain[1] - initialDomain[0]) / (1 + initialDomain[0]) ];
                    });
                    var completeDomain = [ d3.min(seriesDomains, function(d) {
                        return d[0];
                    }), d3.max(seriesDomains, function(d) {
                        return d[1];
                    }) ];
                    lines.yDomain(completeDomain);
                }
                dx.domain([ 0, data[0].values.length - 1 ]).range([ 0, availableWidth ]).clamp(true);
                var data = indexify(index.i, data);
                var interactivePointerEvents = useInteractiveGuideline ? "none" : "all";
                var wrap = container.selectAll("g.nv-wrap.nv-cumulativeLine").data([ data ]);
                var gEnter = wrap.enter().append("g").attr("class", "nvd3 nv-wrap nv-cumulativeLine").append("g");
                var g = wrap.select("g");
                gEnter.append("g").attr("class", "nv-interactive");
                gEnter.append("g").attr("class", "nv-x nv-axis").style("pointer-events", "none");
                gEnter.append("g").attr("class", "nv-y nv-axis");
                gEnter.append("g").attr("class", "nv-background");
                gEnter.append("g").attr("class", "nv-linesWrap").style("pointer-events", interactivePointerEvents);
                gEnter.append("g").attr("class", "nv-avgLinesWrap").style("pointer-events", "none");
                gEnter.append("g").attr("class", "nv-legendWrap");
                gEnter.append("g").attr("class", "nv-controlsWrap");
                if (showLegend) {
                    legend.width(availableWidth);
                    g.select(".nv-legendWrap").datum(data).call(legend);
                    if (margin.top != legend.height()) {
                        margin.top = legend.height();
                        availableHeight = (height || parseInt(container.style("height")) || 400) - margin.top - margin.bottom;
                    }
                    g.select(".nv-legendWrap").attr("transform", "translate(0," + -margin.top + ")");
                }
                if (showControls) {
                    var controlsData = [ {
                        key: "Re-scale y-axis",
                        disabled: !rescaleY
                    } ];
                    controls.width(140).color([ "#444", "#444", "#444" ]).rightAlign(false).margin({
                        top: 5,
                        right: 0,
                        bottom: 5,
                        left: 20
                    });
                    g.select(".nv-controlsWrap").datum(controlsData).attr("transform", "translate(0," + -margin.top + ")").call(controls);
                }
                wrap.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                rightAlignYAxis && g.select(".nv-y.nv-axis").attr("transform", "translate(" + availableWidth + ",0)");
                var tempDisabled = data.filter(function(d) {
                    return d.tempDisabled;
                });
                wrap.select(".tempDisabled").remove();
                tempDisabled.length && wrap.append("text").attr("class", "tempDisabled").attr("x", availableWidth / 2).attr("y", "-.71em").style("text-anchor", "end").text(tempDisabled.map(function(d) {
                    return d.key;
                }).join(", ") + " values cannot be calculated for this time period.");
                if (useInteractiveGuideline) {
                    interactiveLayer.width(availableWidth).height(availableHeight).margin({
                        left: margin.left,
                        top: margin.top
                    }).svgContainer(container).xScale(x);
                    wrap.select(".nv-interactive").call(interactiveLayer);
                }
                gEnter.select(".nv-background").append("rect");
                g.select(".nv-background rect").attr("width", availableWidth).attr("height", availableHeight);
                lines.y(function(d) {
                    return d.display.y;
                }).width(availableWidth).height(availableHeight).color(data.map(function(d, i) {
                    return d.color || color(d, i);
                }).filter(function(d, i) {
                    return !data[i].disabled && !data[i].tempDisabled;
                }));
                var linesWrap = g.select(".nv-linesWrap").datum(data.filter(function(d) {
                    return !d.disabled && !d.tempDisabled;
                }));
                linesWrap.call(lines);
                data.forEach(function(d, i) {
                    d.seriesIndex = i;
                });
                var avgLineData = data.filter(function(d) {
                    return !d.disabled && !!average(d);
                });
                var avgLines = g.select(".nv-avgLinesWrap").selectAll("line").data(avgLineData, function(d) {
                    return d.key;
                });
                var getAvgLineY = function(d) {
                    var yVal = y(average(d));
                    if (0 > yVal) return 0;
                    if (yVal > availableHeight) return availableHeight;
                    return yVal;
                };
                avgLines.enter().append("line").style("stroke-width", 2).style("stroke-dasharray", "10,10").style("stroke", function(d) {
                    return lines.color()(d, d.seriesIndex);
                }).attr("x1", 0).attr("x2", availableWidth).attr("y1", getAvgLineY).attr("y2", getAvgLineY);
                avgLines.style("stroke-opacity", function(d) {
                    var yVal = y(average(d));
                    if (0 > yVal || yVal > availableHeight) return 0;
                    return 1;
                }).attr("x1", 0).attr("x2", availableWidth).attr("y1", getAvgLineY).attr("y2", getAvgLineY);
                avgLines.exit().remove();
                var indexLine = linesWrap.selectAll(".nv-indexLine").data([ index ]);
                indexLine.enter().append("rect").attr("class", "nv-indexLine").attr("width", 3).attr("x", -2).attr("fill", "red").attr("fill-opacity", .5).style("pointer-events", "all").call(indexDrag);
                indexLine.attr("transform", function(d) {
                    return "translate(" + dx(d.i) + ",0)";
                }).attr("height", availableHeight);
                if (showXAxis) {
                    xAxis.scale(x).ticks(Math.min(data[0].values.length, availableWidth / 70)).tickSize(-availableHeight, 0);
                    g.select(".nv-x.nv-axis").attr("transform", "translate(0," + y.range()[0] + ")");
                    d3.transition(g.select(".nv-x.nv-axis")).call(xAxis);
                }
                if (showYAxis) {
                    yAxis.scale(y).ticks(availableHeight / 36).tickSize(-availableWidth, 0);
                    d3.transition(g.select(".nv-y.nv-axis")).call(yAxis);
                }
                g.select(".nv-background rect").on("click", function() {
                    index.x = d3.mouse(this)[0];
                    index.i = Math.round(dx.invert(index.x));
                    state.index = index.i;
                    dispatch.stateChange(state);
                    updateZero();
                });
                lines.dispatch.on("elementClick", function(e) {
                    index.i = e.pointIndex;
                    index.x = dx(index.i);
                    state.index = index.i;
                    dispatch.stateChange(state);
                    updateZero();
                });
                controls.dispatch.on("legendClick", function(d) {
                    d.disabled = !d.disabled;
                    rescaleY = !d.disabled;
                    state.rescaleY = rescaleY;
                    dispatch.stateChange(state);
                    chart.update();
                });
                legend.dispatch.on("stateChange", function(newState) {
                    state.disabled = newState.disabled;
                    dispatch.stateChange(state);
                    chart.update();
                });
                interactiveLayer.dispatch.on("elementMousemove", function(e) {
                    lines.clearHighlights();
                    var singlePoint, pointIndex, pointXLocation, allData = [];
                    data.filter(function(series, i) {
                        series.seriesIndex = i;
                        return !series.disabled;
                    }).forEach(function(series, i) {
                        pointIndex = nv.interactiveBisect(series.values, e.pointXValue, chart.x());
                        lines.highlightPoint(i, pointIndex, true);
                        var point = series.values[pointIndex];
                        if ("undefined" == typeof point) return;
                        "undefined" == typeof singlePoint && (singlePoint = point);
                        "undefined" == typeof pointXLocation && (pointXLocation = chart.xScale()(chart.x()(point, pointIndex)));
                        allData.push({
                            key: series.key,
                            value: chart.y()(point, pointIndex),
                            color: color(series, series.seriesIndex)
                        });
                    });
                    if (allData.length > 2) {
                        var yValue = chart.yScale().invert(e.mouseY);
                        var domainExtent = Math.abs(chart.yScale().domain()[0] - chart.yScale().domain()[1]);
                        var threshold = .03 * domainExtent;
                        var indexToHighlight = nv.nearestValueIndex(allData.map(function(d) {
                            return d.value;
                        }), yValue, threshold);
                        null !== indexToHighlight && (allData[indexToHighlight].highlight = true);
                    }
                    var xValue = xAxis.tickFormat()(chart.x()(singlePoint, pointIndex), pointIndex);
                    interactiveLayer.tooltip.position({
                        left: pointXLocation + margin.left,
                        top: e.mouseY + margin.top
                    }).chartContainer(that.parentNode).enabled(tooltips).valueFormatter(function(d) {
                        return yAxis.tickFormat()(d);
                    }).data({
                        value: xValue,
                        series: allData
                    })();
                    interactiveLayer.renderGuideLine(pointXLocation);
                });
                interactiveLayer.dispatch.on("elementMouseout", function() {
                    dispatch.tooltipHide();
                    lines.clearHighlights();
                });
                dispatch.on("tooltipShow", function(e) {
                    tooltips && showTooltip(e, that.parentNode);
                });
                dispatch.on("changeState", function(e) {
                    if ("undefined" != typeof e.disabled) {
                        data.forEach(function(series, i) {
                            series.disabled = e.disabled[i];
                        });
                        state.disabled = e.disabled;
                    }
                    if ("undefined" != typeof e.index) {
                        index.i = e.index;
                        index.x = dx(index.i);
                        state.index = e.index;
                        indexLine.data([ index ]);
                    }
                    "undefined" != typeof e.rescaleY && (rescaleY = e.rescaleY);
                    chart.update();
                });
            });
            return chart;
        }
        function indexify(idx, data) {
            return data.map(function(line) {
                if (!line.values) return line;
                var indexValue = line.values[idx];
                if (null == indexValue) return line;
                var v = lines.y()(indexValue, idx);
                if (-.95 > v && !noErrorCheck) {
                    line.tempDisabled = true;
                    return line;
                }
                line.tempDisabled = false;
                line.values = line.values.map(function(point, pointIndex) {
                    point.display = {
                        y: (lines.y()(point, pointIndex) - v) / (1 + v)
                    };
                    return point;
                });
                return line;
            });
        }
        var lines = nv.models.line(), xAxis = nv.models.axis(), yAxis = nv.models.axis(), legend = nv.models.legend(), controls = nv.models.legend(), interactiveLayer = nv.interactiveGuideline();
        var x, y, margin = {
            top: 30,
            right: 30,
            bottom: 50,
            left: 60
        }, color = nv.utils.defaultColor(), width = null, height = null, showLegend = true, showXAxis = true, showYAxis = true, rightAlignYAxis = false, tooltips = true, showControls = true, useInteractiveGuideline = false, rescaleY = true, tooltip = function(key, x, y) {
            return "<h3>" + key + "</h3>" + "<p>" + y + " at " + x + "</p>";
        }, id = lines.id(), state = {
            index: 0,
            rescaleY: rescaleY
        }, defaultState = null, noData = "No Data Available.", average = function(d) {
            return d.average;
        }, dispatch = d3.dispatch("tooltipShow", "tooltipHide", "stateChange", "changeState"), transitionDuration = 250, noErrorCheck = false;
        xAxis.orient("bottom").tickPadding(7);
        yAxis.orient(rightAlignYAxis ? "right" : "left");
        controls.updateState(false);
        var dx = d3.scale.linear(), index = {
            i: 0,
            x: 0
        };
        var showTooltip = function(e, offsetElement) {
            var left = e.pos[0] + (offsetElement.offsetLeft || 0), top = e.pos[1] + (offsetElement.offsetTop || 0), x = xAxis.tickFormat()(lines.x()(e.point, e.pointIndex)), y = yAxis.tickFormat()(lines.y()(e.point, e.pointIndex)), content = tooltip(e.series.key, x, y, e, chart);
            nv.tooltip.show([ left, top ], content, null, null, offsetElement);
        };
        lines.dispatch.on("elementMouseover.tooltip", function(e) {
            e.pos = [ e.pos[0] + margin.left, e.pos[1] + margin.top ];
            dispatch.tooltipShow(e);
        });
        lines.dispatch.on("elementMouseout.tooltip", function(e) {
            dispatch.tooltipHide(e);
        });
        dispatch.on("tooltipHide", function() {
            tooltips && nv.tooltip.cleanup();
        });
        chart.dispatch = dispatch;
        chart.lines = lines;
        chart.legend = legend;
        chart.xAxis = xAxis;
        chart.yAxis = yAxis;
        chart.interactiveLayer = interactiveLayer;
        d3.rebind(chart, lines, "defined", "isArea", "x", "y", "xScale", "yScale", "size", "xDomain", "yDomain", "xRange", "yRange", "forceX", "forceY", "interactive", "clipEdge", "clipVoronoi", "useVoronoi", "id");
        chart.options = nv.utils.optionsFunc.bind(chart);
        chart.margin = function(_) {
            if (!arguments.length) return margin;
            margin.top = "undefined" != typeof _.top ? _.top : margin.top;
            margin.right = "undefined" != typeof _.right ? _.right : margin.right;
            margin.bottom = "undefined" != typeof _.bottom ? _.bottom : margin.bottom;
            margin.left = "undefined" != typeof _.left ? _.left : margin.left;
            return chart;
        };
        chart.width = function(_) {
            if (!arguments.length) return width;
            width = _;
            return chart;
        };
        chart.height = function(_) {
            if (!arguments.length) return height;
            height = _;
            return chart;
        };
        chart.color = function(_) {
            if (!arguments.length) return color;
            color = nv.utils.getColor(_);
            legend.color(color);
            return chart;
        };
        chart.rescaleY = function(_) {
            if (!arguments.length) return rescaleY;
            rescaleY = _;
            return chart;
        };
        chart.showControls = function(_) {
            if (!arguments.length) return showControls;
            showControls = _;
            return chart;
        };
        chart.useInteractiveGuideline = function(_) {
            if (!arguments.length) return useInteractiveGuideline;
            useInteractiveGuideline = _;
            if (true === _) {
                chart.interactive(false);
                chart.useVoronoi(false);
            }
            return chart;
        };
        chart.showLegend = function(_) {
            if (!arguments.length) return showLegend;
            showLegend = _;
            return chart;
        };
        chart.showXAxis = function(_) {
            if (!arguments.length) return showXAxis;
            showXAxis = _;
            return chart;
        };
        chart.showYAxis = function(_) {
            if (!arguments.length) return showYAxis;
            showYAxis = _;
            return chart;
        };
        chart.rightAlignYAxis = function(_) {
            if (!arguments.length) return rightAlignYAxis;
            rightAlignYAxis = _;
            yAxis.orient(_ ? "right" : "left");
            return chart;
        };
        chart.tooltips = function(_) {
            if (!arguments.length) return tooltips;
            tooltips = _;
            return chart;
        };
        chart.tooltipContent = function(_) {
            if (!arguments.length) return tooltip;
            tooltip = _;
            return chart;
        };
        chart.state = function(_) {
            if (!arguments.length) return state;
            state = _;
            return chart;
        };
        chart.defaultState = function(_) {
            if (!arguments.length) return defaultState;
            defaultState = _;
            return chart;
        };
        chart.noData = function(_) {
            if (!arguments.length) return noData;
            noData = _;
            return chart;
        };
        chart.average = function(_) {
            if (!arguments.length) return average;
            average = _;
            return chart;
        };
        chart.transitionDuration = function(_) {
            if (!arguments.length) return transitionDuration;
            transitionDuration = _;
            return chart;
        };
        chart.noErrorCheck = function(_) {
            if (!arguments.length) return noErrorCheck;
            noErrorCheck = _;
            return chart;
        };
        return chart;
    };
    nv.models.discreteBar = function() {
        "use strict";
        function chart(selection) {
            selection.each(function(data) {
                var availableWidth = width - margin.left - margin.right, availableHeight = height - margin.top - margin.bottom, container = d3.select(this);
                data.forEach(function(series, i) {
                    series.values.forEach(function(point) {
                        point.series = i;
                    });
                });
                var seriesData = xDomain && yDomain ? [] : data.map(function(d) {
                    return d.values.map(function(d, i) {
                        return {
                            x: getX(d, i),
                            y: getY(d, i),
                            y0: d.y0
                        };
                    });
                });
                x.domain(xDomain || d3.merge(seriesData).map(function(d) {
                    return d.x;
                })).rangeBands(xRange || [ 0, availableWidth ], .1);
                y.domain(yDomain || d3.extent(d3.merge(seriesData).map(function(d) {
                    return d.y;
                }).concat(forceY)));
                showValues ? y.range(yRange || [ availableHeight - (0 > y.domain()[0] ? 12 : 0), y.domain()[1] > 0 ? 12 : 0 ]) : y.range(yRange || [ availableHeight, 0 ]);
                x0 = x0 || x;
                y0 = y0 || y.copy().range([ y(0), y(0) ]);
                var wrap = container.selectAll("g.nv-wrap.nv-discretebar").data([ data ]);
                var wrapEnter = wrap.enter().append("g").attr("class", "nvd3 nv-wrap nv-discretebar");
                var gEnter = wrapEnter.append("g");
                wrap.select("g");
                gEnter.append("g").attr("class", "nv-groups");
                wrap.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                var groups = wrap.select(".nv-groups").selectAll(".nv-group").data(function(d) {
                    return d;
                }, function(d) {
                    return d.key;
                });
                groups.enter().append("g").style("stroke-opacity", 1e-6).style("fill-opacity", 1e-6);
                groups.exit().transition().style("stroke-opacity", 1e-6).style("fill-opacity", 1e-6).remove();
                groups.attr("class", function(d, i) {
                    return "nv-group nv-series-" + i;
                }).classed("hover", function(d) {
                    return d.hover;
                });
                groups.transition().style("stroke-opacity", 1).style("fill-opacity", .75);
                var bars = groups.selectAll("g.nv-bar").data(function(d) {
                    return d.values;
                });
                bars.exit().remove();
                var barsEnter = bars.enter().append("g").attr("transform", function(d, i) {
                    return "translate(" + (x(getX(d, i)) + .05 * x.rangeBand()) + ", " + y(0) + ")";
                }).on("mouseover", function(d, i) {
                    d3.select(this).classed("hover", true);
                    dispatch.elementMouseover({
                        value: getY(d, i),
                        point: d,
                        series: data[d.series],
                        pos: [ x(getX(d, i)) + x.rangeBand() * (d.series + .5) / data.length, y(getY(d, i)) ],
                        pointIndex: i,
                        seriesIndex: d.series,
                        e: d3.event
                    });
                }).on("mouseout", function(d, i) {
                    d3.select(this).classed("hover", false);
                    dispatch.elementMouseout({
                        value: getY(d, i),
                        point: d,
                        series: data[d.series],
                        pointIndex: i,
                        seriesIndex: d.series,
                        e: d3.event
                    });
                }).on("click", function(d, i) {
                    dispatch.elementClick({
                        value: getY(d, i),
                        point: d,
                        series: data[d.series],
                        pos: [ x(getX(d, i)) + x.rangeBand() * (d.series + .5) / data.length, y(getY(d, i)) ],
                        pointIndex: i,
                        seriesIndex: d.series,
                        e: d3.event
                    });
                    d3.event.stopPropagation();
                }).on("dblclick", function(d, i) {
                    dispatch.elementDblClick({
                        value: getY(d, i),
                        point: d,
                        series: data[d.series],
                        pos: [ x(getX(d, i)) + x.rangeBand() * (d.series + .5) / data.length, y(getY(d, i)) ],
                        pointIndex: i,
                        seriesIndex: d.series,
                        e: d3.event
                    });
                    d3.event.stopPropagation();
                });
                barsEnter.append("rect").attr("height", 0).attr("width", .9 * x.rangeBand() / data.length);
                if (showValues) {
                    barsEnter.append("text").attr("text-anchor", "middle");
                    bars.select("text").text(function(d, i) {
                        return valueFormat(getY(d, i));
                    }).transition().attr("x", .9 * x.rangeBand() / 2).attr("y", function(d, i) {
                        return 0 > getY(d, i) ? y(getY(d, i)) - y(0) + 12 : -4;
                    });
                } else bars.selectAll("text").remove();
                bars.attr("class", function(d, i) {
                    return 0 > getY(d, i) ? "nv-bar negative" : "nv-bar positive";
                }).style("fill", function(d, i) {
                    return d.color || color(d, i);
                }).style("stroke", function(d, i) {
                    return d.color || color(d, i);
                }).select("rect").attr("class", rectClass).transition().attr("width", .9 * x.rangeBand() / data.length);
                bars.transition().attr("transform", function(d, i) {
                    var left = x(getX(d, i)) + .05 * x.rangeBand(), top = 0 > getY(d, i) ? y(0) : 1 > y(0) - y(getY(d, i)) ? y(0) - 1 : y(getY(d, i));
                    return "translate(" + left + ", " + top + ")";
                }).select("rect").attr("height", function(d, i) {
                    return Math.max(Math.abs(y(getY(d, i)) - y(yDomain && yDomain[0] || 0)) || 1);
                });
                x0 = x.copy();
                y0 = y.copy();
            });
            return chart;
        }
        var xDomain, yDomain, xRange, yRange, margin = {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        }, width = 960, height = 500, id = Math.floor(1e4 * Math.random()), x = d3.scale.ordinal(), y = d3.scale.linear(), getX = function(d) {
            return d.x;
        }, getY = function(d) {
            return d.y;
        }, forceY = [ 0 ], color = nv.utils.defaultColor(), showValues = false, valueFormat = d3.format(",.2f"), dispatch = d3.dispatch("chartClick", "elementClick", "elementDblClick", "elementMouseover", "elementMouseout"), rectClass = "discreteBar";
        var x0, y0;
        chart.dispatch = dispatch;
        chart.options = nv.utils.optionsFunc.bind(chart);
        chart.x = function(_) {
            if (!arguments.length) return getX;
            getX = _;
            return chart;
        };
        chart.y = function(_) {
            if (!arguments.length) return getY;
            getY = _;
            return chart;
        };
        chart.margin = function(_) {
            if (!arguments.length) return margin;
            margin.top = "undefined" != typeof _.top ? _.top : margin.top;
            margin.right = "undefined" != typeof _.right ? _.right : margin.right;
            margin.bottom = "undefined" != typeof _.bottom ? _.bottom : margin.bottom;
            margin.left = "undefined" != typeof _.left ? _.left : margin.left;
            return chart;
        };
        chart.width = function(_) {
            if (!arguments.length) return width;
            width = _;
            return chart;
        };
        chart.height = function(_) {
            if (!arguments.length) return height;
            height = _;
            return chart;
        };
        chart.xScale = function(_) {
            if (!arguments.length) return x;
            x = _;
            return chart;
        };
        chart.yScale = function(_) {
            if (!arguments.length) return y;
            y = _;
            return chart;
        };
        chart.xDomain = function(_) {
            if (!arguments.length) return xDomain;
            xDomain = _;
            return chart;
        };
        chart.yDomain = function(_) {
            if (!arguments.length) return yDomain;
            yDomain = _;
            return chart;
        };
        chart.xRange = function(_) {
            if (!arguments.length) return xRange;
            xRange = _;
            return chart;
        };
        chart.yRange = function(_) {
            if (!arguments.length) return yRange;
            yRange = _;
            return chart;
        };
        chart.forceY = function(_) {
            if (!arguments.length) return forceY;
            forceY = _;
            return chart;
        };
        chart.color = function(_) {
            if (!arguments.length) return color;
            color = nv.utils.getColor(_);
            return chart;
        };
        chart.id = function(_) {
            if (!arguments.length) return id;
            id = _;
            return chart;
        };
        chart.showValues = function(_) {
            if (!arguments.length) return showValues;
            showValues = _;
            return chart;
        };
        chart.valueFormat = function(_) {
            if (!arguments.length) return valueFormat;
            valueFormat = _;
            return chart;
        };
        chart.rectClass = function(_) {
            if (!arguments.length) return rectClass;
            rectClass = _;
            return chart;
        };
        return chart;
    };
    nv.models.discreteBarChart = function() {
        "use strict";
        function chart(selection) {
            selection.each(function(data) {
                var container = d3.select(this), that = this;
                var availableWidth = (width || parseInt(container.style("width")) || 960) - margin.left - margin.right, availableHeight = (height || parseInt(container.style("height")) || 400) - margin.top - margin.bottom;
                chart.update = function() {
                    dispatch.beforeUpdate();
                    container.transition().duration(transitionDuration).call(chart);
                };
                chart.container = this;
                if (!(data && data.length && data.filter(function(d) {
                    return d.values.length;
                }).length)) {
                    var noDataText = container.selectAll(".nv-noData").data([ noData ]);
                    noDataText.enter().append("text").attr("class", "nvd3 nv-noData").attr("dy", "-.7em").style("text-anchor", "middle");
                    noDataText.attr("x", margin.left + availableWidth / 2).attr("y", margin.top + availableHeight / 2).text(function(d) {
                        return d;
                    });
                    return chart;
                }
                container.selectAll(".nv-noData").remove();
                x = discretebar.xScale();
                y = discretebar.yScale().clamp(true);
                var wrap = container.selectAll("g.nv-wrap.nv-discreteBarWithAxes").data([ data ]);
                var gEnter = wrap.enter().append("g").attr("class", "nvd3 nv-wrap nv-discreteBarWithAxes").append("g");
                var defsEnter = gEnter.append("defs");
                var g = wrap.select("g");
                gEnter.append("g").attr("class", "nv-x nv-axis");
                gEnter.append("g").attr("class", "nv-y nv-axis").append("g").attr("class", "nv-zeroLine").append("line");
                gEnter.append("g").attr("class", "nv-barsWrap");
                g.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                rightAlignYAxis && g.select(".nv-y.nv-axis").attr("transform", "translate(" + availableWidth + ",0)");
                discretebar.width(availableWidth).height(availableHeight);
                var barsWrap = g.select(".nv-barsWrap").datum(data.filter(function(d) {
                    return !d.disabled;
                }));
                barsWrap.transition().call(discretebar);
                defsEnter.append("clipPath").attr("id", "nv-x-label-clip-" + discretebar.id()).append("rect");
                g.select("#nv-x-label-clip-" + discretebar.id() + " rect").attr("width", x.rangeBand() * (staggerLabels ? 2 : 1)).attr("height", 16).attr("x", -x.rangeBand() / (staggerLabels ? 1 : 2));
                if (showXAxis) {
                    xAxis.scale(x).ticks(availableWidth / 100).tickSize(-availableHeight, 0);
                    g.select(".nv-x.nv-axis").attr("transform", "translate(0," + (y.range()[0] + (discretebar.showValues() && 0 > y.domain()[0] ? 16 : 0)) + ")");
                    g.select(".nv-x.nv-axis").transition().call(xAxis);
                    var xTicks = g.select(".nv-x.nv-axis").selectAll("g");
                    staggerLabels && xTicks.selectAll("text").attr("transform", function(d, i, j) {
                        return "translate(0," + (0 == j % 2 ? "5" : "17") + ")";
                    });
                }
                if (showYAxis) {
                    yAxis.scale(y).ticks(availableHeight / 36).tickSize(-availableWidth, 0);
                    g.select(".nv-y.nv-axis").transition().call(yAxis);
                }
                g.select(".nv-zeroLine line").attr("x1", 0).attr("x2", availableWidth).attr("y1", y(0)).attr("y2", y(0));
                dispatch.on("tooltipShow", function(e) {
                    tooltips && showTooltip(e, that.parentNode);
                });
            });
            return chart;
        }
        var discretebar = nv.models.discreteBar(), xAxis = nv.models.axis(), yAxis = nv.models.axis();
        var x, y, margin = {
            top: 15,
            right: 10,
            bottom: 50,
            left: 60
        }, width = null, height = null, color = nv.utils.getColor(), showXAxis = true, showYAxis = true, rightAlignYAxis = false, staggerLabels = false, tooltips = true, tooltip = function(key, x, y) {
            return "<h3>" + x + "</h3>" + "<p>" + y + "</p>";
        }, noData = "No Data Available.", dispatch = d3.dispatch("tooltipShow", "tooltipHide", "beforeUpdate"), transitionDuration = 250;
        xAxis.orient("bottom").highlightZero(false).showMaxMin(false).tickFormat(function(d) {
            return d;
        });
        yAxis.orient(rightAlignYAxis ? "right" : "left").tickFormat(d3.format(",.1f"));
        var showTooltip = function(e, offsetElement) {
            var left = e.pos[0] + (offsetElement.offsetLeft || 0), top = e.pos[1] + (offsetElement.offsetTop || 0), x = xAxis.tickFormat()(discretebar.x()(e.point, e.pointIndex)), y = yAxis.tickFormat()(discretebar.y()(e.point, e.pointIndex)), content = tooltip(e.series.key, x, y, e, chart);
            nv.tooltip.show([ left, top ], content, 0 > e.value ? "n" : "s", null, offsetElement);
        };
        discretebar.dispatch.on("elementMouseover.tooltip", function(e) {
            e.pos = [ e.pos[0] + margin.left, e.pos[1] + margin.top ];
            dispatch.tooltipShow(e);
        });
        discretebar.dispatch.on("elementMouseout.tooltip", function(e) {
            dispatch.tooltipHide(e);
        });
        dispatch.on("tooltipHide", function() {
            tooltips && nv.tooltip.cleanup();
        });
        chart.dispatch = dispatch;
        chart.discretebar = discretebar;
        chart.xAxis = xAxis;
        chart.yAxis = yAxis;
        d3.rebind(chart, discretebar, "x", "y", "xDomain", "yDomain", "xRange", "yRange", "forceX", "forceY", "id", "showValues", "valueFormat");
        chart.options = nv.utils.optionsFunc.bind(chart);
        chart.margin = function(_) {
            if (!arguments.length) return margin;
            margin.top = "undefined" != typeof _.top ? _.top : margin.top;
            margin.right = "undefined" != typeof _.right ? _.right : margin.right;
            margin.bottom = "undefined" != typeof _.bottom ? _.bottom : margin.bottom;
            margin.left = "undefined" != typeof _.left ? _.left : margin.left;
            return chart;
        };
        chart.width = function(_) {
            if (!arguments.length) return width;
            width = _;
            return chart;
        };
        chart.height = function(_) {
            if (!arguments.length) return height;
            height = _;
            return chart;
        };
        chart.color = function(_) {
            if (!arguments.length) return color;
            color = nv.utils.getColor(_);
            discretebar.color(color);
            return chart;
        };
        chart.showXAxis = function(_) {
            if (!arguments.length) return showXAxis;
            showXAxis = _;
            return chart;
        };
        chart.showYAxis = function(_) {
            if (!arguments.length) return showYAxis;
            showYAxis = _;
            return chart;
        };
        chart.rightAlignYAxis = function(_) {
            if (!arguments.length) return rightAlignYAxis;
            rightAlignYAxis = _;
            yAxis.orient(_ ? "right" : "left");
            return chart;
        };
        chart.staggerLabels = function(_) {
            if (!arguments.length) return staggerLabels;
            staggerLabels = _;
            return chart;
        };
        chart.tooltips = function(_) {
            if (!arguments.length) return tooltips;
            tooltips = _;
            return chart;
        };
        chart.tooltipContent = function(_) {
            if (!arguments.length) return tooltip;
            tooltip = _;
            return chart;
        };
        chart.noData = function(_) {
            if (!arguments.length) return noData;
            noData = _;
            return chart;
        };
        chart.transitionDuration = function(_) {
            if (!arguments.length) return transitionDuration;
            transitionDuration = _;
            return chart;
        };
        return chart;
    };
    nv.models.distribution = function() {
        "use strict";
        function chart(selection) {
            selection.each(function(data) {
                var naxis = (width - ("x" === axis ? margin.left + margin.right : margin.top + margin.bottom), 
                "x" == axis ? "y" : "x"), container = d3.select(this);
                scale0 = scale0 || scale;
                var wrap = container.selectAll("g.nv-distribution").data([ data ]);
                var wrapEnter = wrap.enter().append("g").attr("class", "nvd3 nv-distribution");
                wrapEnter.append("g");
                var g = wrap.select("g");
                wrap.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                var distWrap = g.selectAll("g.nv-dist").data(function(d) {
                    return d;
                }, function(d) {
                    return d.key;
                });
                distWrap.enter().append("g");
                distWrap.attr("class", function(d, i) {
                    return "nv-dist nv-series-" + i;
                }).style("stroke", function(d, i) {
                    return color(d, i);
                });
                var dist = distWrap.selectAll("line.nv-dist" + axis).data(function(d) {
                    return d.values;
                });
                dist.enter().append("line").attr(axis + "1", function(d, i) {
                    return scale0(getData(d, i));
                }).attr(axis + "2", function(d, i) {
                    return scale0(getData(d, i));
                });
                distWrap.exit().selectAll("line.nv-dist" + axis).transition().attr(axis + "1", function(d, i) {
                    return scale(getData(d, i));
                }).attr(axis + "2", function(d, i) {
                    return scale(getData(d, i));
                }).style("stroke-opacity", 0).remove();
                dist.attr("class", function(d, i) {
                    return "nv-dist" + axis + " nv-dist" + axis + "-" + i;
                }).attr(naxis + "1", 0).attr(naxis + "2", size);
                dist.transition().attr(axis + "1", function(d, i) {
                    return scale(getData(d, i));
                }).attr(axis + "2", function(d, i) {
                    return scale(getData(d, i));
                });
                scale0 = scale.copy();
            });
            return chart;
        }
        var margin = {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        }, width = 400, size = 8, axis = "x", getData = function(d) {
            return d[axis];
        }, color = nv.utils.defaultColor(), scale = d3.scale.linear();
        var scale0;
        chart.options = nv.utils.optionsFunc.bind(chart);
        chart.margin = function(_) {
            if (!arguments.length) return margin;
            margin.top = "undefined" != typeof _.top ? _.top : margin.top;
            margin.right = "undefined" != typeof _.right ? _.right : margin.right;
            margin.bottom = "undefined" != typeof _.bottom ? _.bottom : margin.bottom;
            margin.left = "undefined" != typeof _.left ? _.left : margin.left;
            return chart;
        };
        chart.width = function(_) {
            if (!arguments.length) return width;
            width = _;
            return chart;
        };
        chart.axis = function(_) {
            if (!arguments.length) return axis;
            axis = _;
            return chart;
        };
        chart.size = function(_) {
            if (!arguments.length) return size;
            size = _;
            return chart;
        };
        chart.getData = function(_) {
            if (!arguments.length) return getData;
            getData = d3.functor(_);
            return chart;
        };
        chart.scale = function(_) {
            if (!arguments.length) return scale;
            scale = _;
            return chart;
        };
        chart.color = function(_) {
            if (!arguments.length) return color;
            color = nv.utils.getColor(_);
            return chart;
        };
        return chart;
    };
    nv.models.historicalBarChart = function() {
        "use strict";
        function chart(selection) {
            selection.each(function(data) {
                var container = d3.select(this), that = this;
                var availableWidth = (width || parseInt(container.style("width")) || 960) - margin.left - margin.right, availableHeight = (height || parseInt(container.style("height")) || 400) - margin.top - margin.bottom;
                chart.update = function() {
                    container.transition().duration(transitionDuration).call(chart);
                };
                chart.container = this;
                state.disabled = data.map(function(d) {
                    return !!d.disabled;
                });
                if (!defaultState) {
                    var key;
                    defaultState = {};
                    for (key in state) defaultState[key] = state[key] instanceof Array ? state[key].slice(0) : state[key];
                }
                if (!(data && data.length && data.filter(function(d) {
                    return d.values.length;
                }).length)) {
                    var noDataText = container.selectAll(".nv-noData").data([ noData ]);
                    noDataText.enter().append("text").attr("class", "nvd3 nv-noData").attr("dy", "-.7em").style("text-anchor", "middle");
                    noDataText.attr("x", margin.left + availableWidth / 2).attr("y", margin.top + availableHeight / 2).text(function(d) {
                        return d;
                    });
                    return chart;
                }
                container.selectAll(".nv-noData").remove();
                x = bars.xScale();
                y = bars.yScale();
                var wrap = container.selectAll("g.nv-wrap.nv-historicalBarChart").data([ data ]);
                var gEnter = wrap.enter().append("g").attr("class", "nvd3 nv-wrap nv-historicalBarChart").append("g");
                var g = wrap.select("g");
                gEnter.append("g").attr("class", "nv-x nv-axis");
                gEnter.append("g").attr("class", "nv-y nv-axis");
                gEnter.append("g").attr("class", "nv-barsWrap");
                gEnter.append("g").attr("class", "nv-legendWrap");
                if (showLegend) {
                    legend.width(availableWidth);
                    g.select(".nv-legendWrap").datum(data).call(legend);
                    if (margin.top != legend.height()) {
                        margin.top = legend.height();
                        availableHeight = (height || parseInt(container.style("height")) || 400) - margin.top - margin.bottom;
                    }
                    wrap.select(".nv-legendWrap").attr("transform", "translate(0," + -margin.top + ")");
                }
                wrap.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                rightAlignYAxis && g.select(".nv-y.nv-axis").attr("transform", "translate(" + availableWidth + ",0)");
                bars.width(availableWidth).height(availableHeight).color(data.map(function(d, i) {
                    return d.color || color(d, i);
                }).filter(function(d, i) {
                    return !data[i].disabled;
                }));
                var barsWrap = g.select(".nv-barsWrap").datum(data.filter(function(d) {
                    return !d.disabled;
                }));
                barsWrap.transition().call(bars);
                if (showXAxis) {
                    xAxis.scale(x).tickSize(-availableHeight, 0);
                    g.select(".nv-x.nv-axis").attr("transform", "translate(0," + y.range()[0] + ")");
                    g.select(".nv-x.nv-axis").transition().call(xAxis);
                }
                if (showYAxis) {
                    yAxis.scale(y).ticks(availableHeight / 36).tickSize(-availableWidth, 0);
                    g.select(".nv-y.nv-axis").transition().call(yAxis);
                }
                legend.dispatch.on("legendClick", function(d) {
                    d.disabled = !d.disabled;
                    data.filter(function(d) {
                        return !d.disabled;
                    }).length || data.map(function(d) {
                        d.disabled = false;
                        wrap.selectAll(".nv-series").classed("disabled", false);
                        return d;
                    });
                    state.disabled = data.map(function(d) {
                        return !!d.disabled;
                    });
                    dispatch.stateChange(state);
                    selection.transition().call(chart);
                });
                legend.dispatch.on("legendDblclick", function(d) {
                    data.forEach(function(d) {
                        d.disabled = true;
                    });
                    d.disabled = false;
                    state.disabled = data.map(function(d) {
                        return !!d.disabled;
                    });
                    dispatch.stateChange(state);
                    chart.update();
                });
                dispatch.on("tooltipShow", function(e) {
                    tooltips && showTooltip(e, that.parentNode);
                });
                dispatch.on("changeState", function(e) {
                    if ("undefined" != typeof e.disabled) {
                        data.forEach(function(series, i) {
                            series.disabled = e.disabled[i];
                        });
                        state.disabled = e.disabled;
                    }
                    chart.update();
                });
            });
            return chart;
        }
        var bars = nv.models.historicalBar(), xAxis = nv.models.axis(), yAxis = nv.models.axis(), legend = nv.models.legend();
        var x, y, margin = {
            top: 30,
            right: 90,
            bottom: 50,
            left: 90
        }, color = nv.utils.defaultColor(), width = null, height = null, showLegend = false, showXAxis = true, showYAxis = true, rightAlignYAxis = false, tooltips = true, tooltip = function(key, x, y) {
            return "<h3>" + key + "</h3>" + "<p>" + y + " at " + x + "</p>";
        }, state = {}, defaultState = null, noData = "No Data Available.", dispatch = d3.dispatch("tooltipShow", "tooltipHide", "stateChange", "changeState"), transitionDuration = 250;
        xAxis.orient("bottom").tickPadding(7);
        yAxis.orient(rightAlignYAxis ? "right" : "left");
        var showTooltip = function(e, offsetElement) {
            if (offsetElement) {
                var svg = d3.select(offsetElement).select("svg");
                var viewBox = svg.node() ? svg.attr("viewBox") : null;
                if (viewBox) {
                    viewBox = viewBox.split(" ");
                    var ratio = parseInt(svg.style("width")) / viewBox[2];
                    e.pos[0] = e.pos[0] * ratio;
                    e.pos[1] = e.pos[1] * ratio;
                }
            }
            var left = e.pos[0] + (offsetElement.offsetLeft || 0), top = e.pos[1] + (offsetElement.offsetTop || 0), x = xAxis.tickFormat()(bars.x()(e.point, e.pointIndex)), y = yAxis.tickFormat()(bars.y()(e.point, e.pointIndex)), content = tooltip(e.series.key, x, y, e, chart);
            nv.tooltip.show([ left, top ], content, null, null, offsetElement);
        };
        bars.dispatch.on("elementMouseover.tooltip", function(e) {
            e.pos = [ e.pos[0] + margin.left, e.pos[1] + margin.top ];
            dispatch.tooltipShow(e);
        });
        bars.dispatch.on("elementMouseout.tooltip", function(e) {
            dispatch.tooltipHide(e);
        });
        dispatch.on("tooltipHide", function() {
            tooltips && nv.tooltip.cleanup();
        });
        chart.dispatch = dispatch;
        chart.bars = bars;
        chart.legend = legend;
        chart.xAxis = xAxis;
        chart.yAxis = yAxis;
        d3.rebind(chart, bars, "defined", "isArea", "x", "y", "size", "xScale", "yScale", "xDomain", "yDomain", "xRange", "yRange", "forceX", "forceY", "interactive", "clipEdge", "clipVoronoi", "id", "interpolate", "highlightPoint", "clearHighlights", "interactive");
        chart.options = nv.utils.optionsFunc.bind(chart);
        chart.margin = function(_) {
            if (!arguments.length) return margin;
            margin.top = "undefined" != typeof _.top ? _.top : margin.top;
            margin.right = "undefined" != typeof _.right ? _.right : margin.right;
            margin.bottom = "undefined" != typeof _.bottom ? _.bottom : margin.bottom;
            margin.left = "undefined" != typeof _.left ? _.left : margin.left;
            return chart;
        };
        chart.width = function(_) {
            if (!arguments.length) return width;
            width = _;
            return chart;
        };
        chart.height = function(_) {
            if (!arguments.length) return height;
            height = _;
            return chart;
        };
        chart.color = function(_) {
            if (!arguments.length) return color;
            color = nv.utils.getColor(_);
            legend.color(color);
            return chart;
        };
        chart.showLegend = function(_) {
            if (!arguments.length) return showLegend;
            showLegend = _;
            return chart;
        };
        chart.showXAxis = function(_) {
            if (!arguments.length) return showXAxis;
            showXAxis = _;
            return chart;
        };
        chart.showYAxis = function(_) {
            if (!arguments.length) return showYAxis;
            showYAxis = _;
            return chart;
        };
        chart.rightAlignYAxis = function(_) {
            if (!arguments.length) return rightAlignYAxis;
            rightAlignYAxis = _;
            yAxis.orient(_ ? "right" : "left");
            return chart;
        };
        chart.tooltips = function(_) {
            if (!arguments.length) return tooltips;
            tooltips = _;
            return chart;
        };
        chart.tooltipContent = function(_) {
            if (!arguments.length) return tooltip;
            tooltip = _;
            return chart;
        };
        chart.state = function(_) {
            if (!arguments.length) return state;
            state = _;
            return chart;
        };
        chart.defaultState = function(_) {
            if (!arguments.length) return defaultState;
            defaultState = _;
            return chart;
        };
        chart.noData = function(_) {
            if (!arguments.length) return noData;
            noData = _;
            return chart;
        };
        chart.transitionDuration = function(_) {
            if (!arguments.length) return transitionDuration;
            transitionDuration = _;
            return chart;
        };
        return chart;
    };
    nv.models.indentedTree = function() {
        "use strict";
        function chart(selection) {
            selection.each(function(data) {
                function click(d, _, unshift) {
                    d3.event.stopPropagation();
                    if (d3.event.shiftKey && !unshift) {
                        d3.event.shiftKey = false;
                        d.values && d.values.forEach(function(node) {
                            (node.values || node._values) && click(node, 0, true);
                        });
                        return true;
                    }
                    if (!hasChildren(d)) return true;
                    if (d.values) {
                        d._values = d.values;
                        d.values = null;
                    } else {
                        d.values = d._values;
                        d._values = null;
                    }
                    chart.update();
                }
                function icon(d) {
                    return d._values && d._values.length ? iconOpen : d.values && d.values.length ? iconClose : "";
                }
                function folded(d) {
                    return d._values && d._values.length;
                }
                function hasChildren(d) {
                    var values = d.values || d._values;
                    return values && values.length;
                }
                var depth = 1, container = d3.select(this);
                var tree = d3.layout.tree().children(function(d) {
                    return d.values;
                }).size([ height, childIndent ]);
                chart.update = function() {
                    container.transition().duration(600).call(chart);
                };
                data[0] || (data[0] = {
                    key: noData
                });
                var nodes = tree.nodes(data[0]);
                var wrap = d3.select(this).selectAll("div").data([ [ nodes ] ]);
                var wrapEnter = wrap.enter().append("div").attr("class", "nvd3 nv-wrap nv-indentedtree");
                var tableEnter = wrapEnter.append("table");
                var table = wrap.select("table").attr("width", "100%").attr("class", tableClass);
                if (header) {
                    var thead = tableEnter.append("thead");
                    var theadRow1 = thead.append("tr");
                    columns.forEach(function(column) {
                        theadRow1.append("th").attr("width", column.width ? column.width : "10%").style("text-align", "numeric" == column.type ? "right" : "left").append("span").text(column.label);
                    });
                }
                var tbody = table.selectAll("tbody").data(function(d) {
                    return d;
                });
                tbody.enter().append("tbody");
                depth = d3.max(nodes, function(node) {
                    return node.depth;
                });
                tree.size([ height, depth * childIndent ]);
                var node = tbody.selectAll("tr").data(function(d) {
                    return d.filter(function(d) {
                        return filterZero && !d.children ? filterZero(d) : true;
                    });
                }, function(d) {
                    return d.id || d.id || ++idx;
                });
                node.exit().remove();
                node.select("img.nv-treeicon").attr("src", icon).classed("folded", folded);
                var nodeEnter = node.enter().append("tr");
                columns.forEach(function(column, index) {
                    var nodeName = nodeEnter.append("td").style("padding-left", function(d) {
                        return (index ? 0 : d.depth * childIndent + 12 + (icon(d) ? 0 : 16)) + "px";
                    }, "important").style("text-align", "numeric" == column.type ? "right" : "left");
                    0 == index && nodeName.append("img").classed("nv-treeicon", true).classed("nv-folded", folded).attr("src", icon).style("width", "14px").style("height", "14px").style("padding", "0 1px").style("display", function(d) {
                        return icon(d) ? "inline-block" : "none";
                    }).on("click", click);
                    nodeName.each(function(d) {
                        !index && getUrl(d) ? d3.select(this).append("a").attr("href", getUrl).attr("class", d3.functor(column.classes)).append("span") : d3.select(this).append("span");
                        d3.select(this).select("span").attr("class", d3.functor(column.classes)).text(function(d) {
                            return column.format ? column.format(d) : d[column.key] || "-";
                        });
                    });
                    if (column.showCount) {
                        nodeName.append("span").attr("class", "nv-childrenCount");
                        node.selectAll("span.nv-childrenCount").text(function(d) {
                            return d.values && d.values.length || d._values && d._values.length ? "(" + (d.values && d.values.filter(function(d) {
                                return filterZero ? filterZero(d) : true;
                            }).length || d._values && d._values.filter(function(d) {
                                return filterZero ? filterZero(d) : true;
                            }).length || 0) + ")" : "";
                        });
                    }
                });
                node.order().on("click", function(d) {
                    dispatch.elementClick({
                        row: this,
                        data: d,
                        pos: [ d.x, d.y ]
                    });
                }).on("dblclick", function(d) {
                    dispatch.elementDblclick({
                        row: this,
                        data: d,
                        pos: [ d.x, d.y ]
                    });
                }).on("mouseover", function(d) {
                    dispatch.elementMouseover({
                        row: this,
                        data: d,
                        pos: [ d.x, d.y ]
                    });
                }).on("mouseout", function(d) {
                    dispatch.elementMouseout({
                        row: this,
                        data: d,
                        pos: [ d.x, d.y ]
                    });
                });
            });
            return chart;
        }
        var margin = {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        }, width = 960, height = 500, color = nv.utils.defaultColor(), id = Math.floor(1e4 * Math.random()), header = true, filterZero = false, noData = "No Data Available.", childIndent = 20, columns = [ {
            key: "key",
            label: "Name",
            type: "text"
        } ], tableClass = null, iconOpen = "images/grey-plus.png", iconClose = "images/grey-minus.png", dispatch = d3.dispatch("elementClick", "elementDblclick", "elementMouseover", "elementMouseout"), getUrl = function(d) {
            return d.url;
        };
        var idx = 0;
        chart.options = nv.utils.optionsFunc.bind(chart);
        chart.margin = function(_) {
            if (!arguments.length) return margin;
            margin.top = "undefined" != typeof _.top ? _.top : margin.top;
            margin.right = "undefined" != typeof _.right ? _.right : margin.right;
            margin.bottom = "undefined" != typeof _.bottom ? _.bottom : margin.bottom;
            margin.left = "undefined" != typeof _.left ? _.left : margin.left;
            return chart;
        };
        chart.width = function(_) {
            if (!arguments.length) return width;
            width = _;
            return chart;
        };
        chart.height = function(_) {
            if (!arguments.length) return height;
            height = _;
            return chart;
        };
        chart.color = function(_) {
            if (!arguments.length) return color;
            color = nv.utils.getColor(_);
            scatter.color(color);
            return chart;
        };
        chart.id = function(_) {
            if (!arguments.length) return id;
            id = _;
            return chart;
        };
        chart.header = function(_) {
            if (!arguments.length) return header;
            header = _;
            return chart;
        };
        chart.noData = function(_) {
            if (!arguments.length) return noData;
            noData = _;
            return chart;
        };
        chart.filterZero = function(_) {
            if (!arguments.length) return filterZero;
            filterZero = _;
            return chart;
        };
        chart.columns = function(_) {
            if (!arguments.length) return columns;
            columns = _;
            return chart;
        };
        chart.tableClass = function(_) {
            if (!arguments.length) return tableClass;
            tableClass = _;
            return chart;
        };
        chart.iconOpen = function(_) {
            if (!arguments.length) return iconOpen;
            iconOpen = _;
            return chart;
        };
        chart.iconClose = function(_) {
            if (!arguments.length) return iconClose;
            iconClose = _;
            return chart;
        };
        chart.getUrl = function(_) {
            if (!arguments.length) return getUrl;
            getUrl = _;
            return chart;
        };
        return chart;
    };
    nv.models.legend = function() {
        "use strict";
        function chart(selection) {
            selection.each(function(data) {
                var availableWidth = width - margin.left - margin.right, container = d3.select(this);
                var wrap = container.selectAll("g.nv-legend").data([ data ]);
                wrap.enter().append("g").attr("class", "nvd3 nv-legend").append("g");
                var g = wrap.select("g");
                wrap.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                var series = g.selectAll(".nv-series").data(function(d) {
                    return d;
                });
                var seriesEnter = series.enter().append("g").attr("class", "nv-series").on("mouseover", function(d, i) {
                    dispatch.legendMouseover(d, i);
                }).on("mouseout", function(d, i) {
                    dispatch.legendMouseout(d, i);
                }).on("click", function(d, i) {
                    dispatch.legendClick(d, i);
                    if (updateState) {
                        if (radioButtonMode) {
                            data.forEach(function(series) {
                                series.disabled = true;
                            });
                            d.disabled = false;
                        } else {
                            d.disabled = !d.disabled;
                            data.every(function(series) {
                                return series.disabled;
                            }) && data.forEach(function(series) {
                                series.disabled = false;
                            });
                        }
                        dispatch.stateChange({
                            disabled: data.map(function(d) {
                                return !!d.disabled;
                            })
                        });
                    }
                }).on("dblclick", function(d, i) {
                    dispatch.legendDblclick(d, i);
                    if (updateState) {
                        data.forEach(function(series) {
                            series.disabled = true;
                        });
                        d.disabled = false;
                        dispatch.stateChange({
                            disabled: data.map(function(d) {
                                return !!d.disabled;
                            })
                        });
                    }
                });
                seriesEnter.append("circle").style("stroke-width", 2).attr("class", "nv-legend-symbol").attr("r", 5);
                seriesEnter.append("text").attr("text-anchor", "start").attr("class", "nv-legend-text").attr("dy", ".32em").attr("dx", "8");
                series.classed("disabled", function(d) {
                    return d.disabled;
                });
                series.exit().remove();
                series.select("circle").style("fill", function(d, i) {
                    return d.color || color(d, i);
                }).style("stroke", function(d, i) {
                    return d.color || color(d, i);
                });
                series.select("text").text(getKey);
                if (align) {
                    var seriesWidths = [];
                    series.each(function() {
                        var legendText = d3.select(this).select("text");
                        var nodeTextLength;
                        try {
                            nodeTextLength = legendText.getComputedTextLength();
                            if (0 >= nodeTextLength) throw Error();
                        } catch (e) {
                            nodeTextLength = nv.utils.calcApproxTextWidth(legendText);
                        }
                        seriesWidths.push(nodeTextLength + 28);
                    });
                    var seriesPerRow = 0;
                    var legendWidth = 0;
                    var columnWidths = [];
                    while (availableWidth > legendWidth && seriesWidths.length > seriesPerRow) {
                        columnWidths[seriesPerRow] = seriesWidths[seriesPerRow];
                        legendWidth += seriesWidths[seriesPerRow++];
                    }
                    0 === seriesPerRow && (seriesPerRow = 1);
                    while (legendWidth > availableWidth && seriesPerRow > 1) {
                        columnWidths = [];
                        seriesPerRow--;
                        for (var k = 0; seriesWidths.length > k; k++) seriesWidths[k] > (columnWidths[k % seriesPerRow] || 0) && (columnWidths[k % seriesPerRow] = seriesWidths[k]);
                        legendWidth = columnWidths.reduce(function(prev, cur) {
                            return prev + cur;
                        });
                    }
                    var xPositions = [];
                    for (var i = 0, curX = 0; seriesPerRow > i; i++) {
                        xPositions[i] = curX;
                        curX += columnWidths[i];
                    }
                    series.attr("transform", function(d, i) {
                        return "translate(" + xPositions[i % seriesPerRow] + "," + (5 + 20 * Math.floor(i / seriesPerRow)) + ")";
                    });
                    rightAlign ? g.attr("transform", "translate(" + (width - margin.right - legendWidth) + "," + margin.top + ")") : g.attr("transform", "translate(0," + margin.top + ")");
                    height = margin.top + margin.bottom + 20 * Math.ceil(seriesWidths.length / seriesPerRow);
                } else {
                    var xpos, ypos = 5, newxpos = 5, maxwidth = 0;
                    series.attr("transform", function() {
                        var length = d3.select(this).select("text").node().getComputedTextLength() + 28;
                        xpos = newxpos;
                        if (margin.left + margin.right + xpos + length > width) {
                            newxpos = xpos = 5;
                            ypos += 20;
                        }
                        newxpos += length;
                        newxpos > maxwidth && (maxwidth = newxpos);
                        return "translate(" + xpos + "," + ypos + ")";
                    });
                    g.attr("transform", "translate(" + (width - margin.right - maxwidth) + "," + margin.top + ")");
                    height = margin.top + margin.bottom + ypos + 15;
                }
            });
            return chart;
        }
        var margin = {
            top: 5,
            right: 0,
            bottom: 5,
            left: 0
        }, width = 400, height = 20, getKey = function(d) {
            return d.key;
        }, color = nv.utils.defaultColor(), align = true, rightAlign = true, updateState = true, radioButtonMode = false, dispatch = d3.dispatch("legendClick", "legendDblclick", "legendMouseover", "legendMouseout", "stateChange");
        chart.dispatch = dispatch;
        chart.options = nv.utils.optionsFunc.bind(chart);
        chart.margin = function(_) {
            if (!arguments.length) return margin;
            margin.top = "undefined" != typeof _.top ? _.top : margin.top;
            margin.right = "undefined" != typeof _.right ? _.right : margin.right;
            margin.bottom = "undefined" != typeof _.bottom ? _.bottom : margin.bottom;
            margin.left = "undefined" != typeof _.left ? _.left : margin.left;
            return chart;
        };
        chart.width = function(_) {
            if (!arguments.length) return width;
            width = _;
            return chart;
        };
        chart.height = function(_) {
            if (!arguments.length) return height;
            height = _;
            return chart;
        };
        chart.key = function(_) {
            if (!arguments.length) return getKey;
            getKey = _;
            return chart;
        };
        chart.color = function(_) {
            if (!arguments.length) return color;
            color = nv.utils.getColor(_);
            return chart;
        };
        chart.align = function(_) {
            if (!arguments.length) return align;
            align = _;
            return chart;
        };
        chart.rightAlign = function(_) {
            if (!arguments.length) return rightAlign;
            rightAlign = _;
            return chart;
        };
        chart.updateState = function(_) {
            if (!arguments.length) return updateState;
            updateState = _;
            return chart;
        };
        chart.radioButtonMode = function(_) {
            if (!arguments.length) return radioButtonMode;
            radioButtonMode = _;
            return chart;
        };
        return chart;
    };
    nv.models.line = function() {
        "use strict";
        function chart(selection) {
            selection.each(function(data) {
                var availableWidth = width - margin.left - margin.right, availableHeight = height - margin.top - margin.bottom, container = d3.select(this);
                x = scatter.xScale();
                y = scatter.yScale();
                x0 = x0 || x;
                y0 = y0 || y;
                var wrap = container.selectAll("g.nv-wrap.nv-line").data([ data ]);
                var wrapEnter = wrap.enter().append("g").attr("class", "nvd3 nv-wrap nv-line");
                var defsEnter = wrapEnter.append("defs");
                var gEnter = wrapEnter.append("g");
                var g = wrap.select("g");
                gEnter.append("g").attr("class", "nv-groups");
                gEnter.append("g").attr("class", "nv-scatterWrap");
                wrap.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                scatter.width(availableWidth).height(availableHeight);
                var scatterWrap = wrap.select(".nv-scatterWrap");
                scatterWrap.transition().call(scatter);
                defsEnter.append("clipPath").attr("id", "nv-edge-clip-" + scatter.id()).append("rect");
                wrap.select("#nv-edge-clip-" + scatter.id() + " rect").attr("width", availableWidth).attr("height", availableHeight > 0 ? availableHeight : 0);
                g.attr("clip-path", clipEdge ? "url(#nv-edge-clip-" + scatter.id() + ")" : "");
                scatterWrap.attr("clip-path", clipEdge ? "url(#nv-edge-clip-" + scatter.id() + ")" : "");
                var groups = wrap.select(".nv-groups").selectAll(".nv-group").data(function(d) {
                    return d;
                }, function(d) {
                    return d.key;
                });
                groups.enter().append("g").style("stroke-opacity", 1e-6).style("fill-opacity", 1e-6);
                groups.exit().remove();
                groups.attr("class", function(d, i) {
                    return "nv-group nv-series-" + i;
                }).classed("hover", function(d) {
                    return d.hover;
                }).style("fill", function(d, i) {
                    return color(d, i);
                }).style("stroke", function(d, i) {
                    return color(d, i);
                });
                groups.transition().style("stroke-opacity", 1).style("fill-opacity", .5);
                var areaPaths = groups.selectAll("path.nv-area").data(function(d) {
                    return isArea(d) ? [ d ] : [];
                });
                areaPaths.enter().append("path").attr("class", "nv-area").attr("d", function(d) {
                    return d3.svg.area().interpolate(interpolate).defined(defined).x(function(d, i) {
                        return nv.utils.NaNtoZero(x0(getX(d, i)));
                    }).y0(function(d, i) {
                        return nv.utils.NaNtoZero(y0(getY(d, i)));
                    }).y1(function() {
                        return y0(0 >= y.domain()[0] ? y.domain()[1] >= 0 ? 0 : y.domain()[1] : y.domain()[0]);
                    }).apply(this, [ d.values ]);
                });
                groups.exit().selectAll("path.nv-area").remove();
                areaPaths.transition().attr("d", function(d) {
                    return d3.svg.area().interpolate(interpolate).defined(defined).x(function(d, i) {
                        return nv.utils.NaNtoZero(x(getX(d, i)));
                    }).y0(function(d, i) {
                        return nv.utils.NaNtoZero(y(getY(d, i)));
                    }).y1(function() {
                        return y(0 >= y.domain()[0] ? y.domain()[1] >= 0 ? 0 : y.domain()[1] : y.domain()[0]);
                    }).apply(this, [ d.values ]);
                });
                var linePaths = groups.selectAll("path.nv-line").data(function(d) {
                    return [ d.values ];
                });
                linePaths.enter().append("path").attr("class", "nv-line").attr("d", d3.svg.line().interpolate(interpolate).defined(defined).x(function(d, i) {
                    return nv.utils.NaNtoZero(x0(getX(d, i)));
                }).y(function(d, i) {
                    return nv.utils.NaNtoZero(y0(getY(d, i)));
                }));
                linePaths.transition().attr("d", d3.svg.line().interpolate(interpolate).defined(defined).x(function(d, i) {
                    return nv.utils.NaNtoZero(x(getX(d, i)));
                }).y(function(d, i) {
                    return nv.utils.NaNtoZero(y(getY(d, i)));
                }));
                x0 = x.copy();
                y0 = y.copy();
            });
            return chart;
        }
        var scatter = nv.models.scatter();
        var x, y, margin = {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        }, width = 960, height = 500, color = nv.utils.defaultColor(), getX = function(d) {
            return d.x;
        }, getY = function(d) {
            return d.y;
        }, defined = function(d, i) {
            return !isNaN(getY(d, i)) && null !== getY(d, i);
        }, isArea = function(d) {
            return d.area;
        }, clipEdge = false, interpolate = "linear";
        scatter.size(16).sizeDomain([ 16, 256 ]);
        var x0, y0;
        chart.dispatch = scatter.dispatch;
        chart.scatter = scatter;
        d3.rebind(chart, scatter, "id", "interactive", "size", "xScale", "yScale", "zScale", "xDomain", "yDomain", "xRange", "yRange", "sizeDomain", "forceX", "forceY", "forceSize", "clipVoronoi", "useVoronoi", "clipRadius", "padData", "highlightPoint", "clearHighlights");
        chart.options = nv.utils.optionsFunc.bind(chart);
        chart.margin = function(_) {
            if (!arguments.length) return margin;
            margin.top = "undefined" != typeof _.top ? _.top : margin.top;
            margin.right = "undefined" != typeof _.right ? _.right : margin.right;
            margin.bottom = "undefined" != typeof _.bottom ? _.bottom : margin.bottom;
            margin.left = "undefined" != typeof _.left ? _.left : margin.left;
            return chart;
        };
        chart.width = function(_) {
            if (!arguments.length) return width;
            width = _;
            return chart;
        };
        chart.height = function(_) {
            if (!arguments.length) return height;
            height = _;
            return chart;
        };
        chart.x = function(_) {
            if (!arguments.length) return getX;
            getX = _;
            scatter.x(_);
            return chart;
        };
        chart.y = function(_) {
            if (!arguments.length) return getY;
            getY = _;
            scatter.y(_);
            return chart;
        };
        chart.clipEdge = function(_) {
            if (!arguments.length) return clipEdge;
            clipEdge = _;
            return chart;
        };
        chart.color = function(_) {
            if (!arguments.length) return color;
            color = nv.utils.getColor(_);
            scatter.color(color);
            return chart;
        };
        chart.interpolate = function(_) {
            if (!arguments.length) return interpolate;
            interpolate = _;
            return chart;
        };
        chart.defined = function(_) {
            if (!arguments.length) return defined;
            defined = _;
            return chart;
        };
        chart.isArea = function(_) {
            if (!arguments.length) return isArea;
            isArea = d3.functor(_);
            return chart;
        };
        return chart;
    };
    nv.models.lineChart = function() {
        "use strict";
        function chart(selection) {
            selection.each(function(data) {
                var container = d3.select(this), that = this;
                var availableWidth = (width || parseInt(container.style("width")) || 960) - margin.left - margin.right, availableHeight = (height || parseInt(container.style("height")) || 400) - margin.top - margin.bottom;
                chart.update = function() {
                    container.transition().duration(transitionDuration).call(chart);
                };
                chart.container = this;
                state.disabled = data.map(function(d) {
                    return !!d.disabled;
                });
                if (!defaultState) {
                    var key;
                    defaultState = {};
                    for (key in state) defaultState[key] = state[key] instanceof Array ? state[key].slice(0) : state[key];
                }
                if (!(data && data.length && data.filter(function(d) {
                    return d.values.length;
                }).length)) {
                    var noDataText = container.selectAll(".nv-noData").data([ noData ]);
                    noDataText.enter().append("text").attr("class", "nvd3 nv-noData").attr("dy", "-.7em").style("text-anchor", "middle");
                    noDataText.attr("x", margin.left + availableWidth / 2).attr("y", margin.top + availableHeight / 2).text(function(d) {
                        return d;
                    });
                    return chart;
                }
                container.selectAll(".nv-noData").remove();
                x = lines.xScale();
                y = lines.yScale();
                var wrap = container.selectAll("g.nv-wrap.nv-lineChart").data([ data ]);
                var gEnter = wrap.enter().append("g").attr("class", "nvd3 nv-wrap nv-lineChart").append("g");
                var g = wrap.select("g");
                gEnter.append("rect").style("opacity", 0);
                gEnter.append("g").attr("class", "nv-x nv-axis");
                gEnter.append("g").attr("class", "nv-y nv-axis");
                gEnter.append("g").attr("class", "nv-linesWrap");
                gEnter.append("g").attr("class", "nv-legendWrap");
                gEnter.append("g").attr("class", "nv-interactive");
                g.select("rect").attr("width", availableWidth).attr("height", availableHeight > 0 ? availableHeight : 0);
                if (showLegend) {
                    legend.width(availableWidth);
                    g.select(".nv-legendWrap").datum(data).call(legend);
                    if (margin.top != legend.height()) {
                        margin.top = legend.height();
                        availableHeight = (height || parseInt(container.style("height")) || 400) - margin.top - margin.bottom;
                    }
                    wrap.select(".nv-legendWrap").attr("transform", "translate(0," + -margin.top + ")");
                }
                wrap.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                rightAlignYAxis && g.select(".nv-y.nv-axis").attr("transform", "translate(" + availableWidth + ",0)");
                if (useInteractiveGuideline) {
                    interactiveLayer.width(availableWidth).height(availableHeight).margin({
                        left: margin.left,
                        top: margin.top
                    }).svgContainer(container).xScale(x);
                    wrap.select(".nv-interactive").call(interactiveLayer);
                }
                lines.width(availableWidth).height(availableHeight).color(data.map(function(d, i) {
                    return d.color || color(d, i);
                }).filter(function(d, i) {
                    return !data[i].disabled;
                }));
                var linesWrap = g.select(".nv-linesWrap").datum(data.filter(function(d) {
                    return !d.disabled;
                }));
                linesWrap.transition().call(lines);
                if (showXAxis) {
                    xAxis.scale(x).ticks(availableWidth / 100).tickSize(-availableHeight, 0);
                    g.select(".nv-x.nv-axis").attr("transform", "translate(0," + y.range()[0] + ")");
                    g.select(".nv-x.nv-axis").transition().call(xAxis);
                }
                if (showYAxis) {
                    yAxis.scale(y).ticks(availableHeight / 36).tickSize(-availableWidth, 0);
                    g.select(".nv-y.nv-axis").transition().call(yAxis);
                }
                legend.dispatch.on("stateChange", function(newState) {
                    state = newState;
                    dispatch.stateChange(state);
                    chart.update();
                });
                interactiveLayer.dispatch.on("elementMousemove", function(e) {
                    lines.clearHighlights();
                    var singlePoint, pointIndex, pointXLocation, allData = [];
                    data.filter(function(series, i) {
                        series.seriesIndex = i;
                        return !series.disabled;
                    }).forEach(function(series, i) {
                        pointIndex = nv.interactiveBisect(series.values, e.pointXValue, chart.x());
                        lines.highlightPoint(i, pointIndex, true);
                        var point = series.values[pointIndex];
                        if ("undefined" == typeof point) return;
                        "undefined" == typeof singlePoint && (singlePoint = point);
                        "undefined" == typeof pointXLocation && (pointXLocation = chart.xScale()(chart.x()(point, pointIndex)));
                        allData.push({
                            key: series.key,
                            value: chart.y()(point, pointIndex),
                            color: color(series, series.seriesIndex)
                        });
                    });
                    if (allData.length > 2) {
                        var yValue = chart.yScale().invert(e.mouseY);
                        var domainExtent = Math.abs(chart.yScale().domain()[0] - chart.yScale().domain()[1]);
                        var threshold = .03 * domainExtent;
                        var indexToHighlight = nv.nearestValueIndex(allData.map(function(d) {
                            return d.value;
                        }), yValue, threshold);
                        null !== indexToHighlight && (allData[indexToHighlight].highlight = true);
                    }
                    var xValue = xAxis.tickFormat()(chart.x()(singlePoint, pointIndex));
                    interactiveLayer.tooltip.position({
                        left: pointXLocation + margin.left,
                        top: e.mouseY + margin.top
                    }).chartContainer(that.parentNode).enabled(tooltips).valueFormatter(function(d) {
                        return yAxis.tickFormat()(d);
                    }).data({
                        value: xValue,
                        series: allData
                    })();
                    interactiveLayer.renderGuideLine(pointXLocation);
                });
                interactiveLayer.dispatch.on("elementMouseout", function() {
                    dispatch.tooltipHide();
                    lines.clearHighlights();
                });
                dispatch.on("tooltipShow", function(e) {
                    tooltips && showTooltip(e, that.parentNode);
                });
                dispatch.on("changeState", function(e) {
                    if ("undefined" != typeof e.disabled && data.length === e.disabled.length) {
                        data.forEach(function(series, i) {
                            series.disabled = e.disabled[i];
                        });
                        state.disabled = e.disabled;
                    }
                    chart.update();
                });
            });
            return chart;
        }
        var lines = nv.models.line(), xAxis = nv.models.axis(), yAxis = nv.models.axis(), legend = nv.models.legend(), interactiveLayer = nv.interactiveGuideline();
        var x, y, margin = {
            top: 30,
            right: 20,
            bottom: 50,
            left: 60
        }, color = nv.utils.defaultColor(), width = null, height = null, showLegend = true, showXAxis = true, showYAxis = true, rightAlignYAxis = false, useInteractiveGuideline = false, tooltips = true, tooltip = function(key, x, y) {
            return "<h3>" + key + "</h3>" + "<p>" + y + " at " + x + "</p>";
        }, state = {}, defaultState = null, noData = "No Data Available.", dispatch = d3.dispatch("tooltipShow", "tooltipHide", "stateChange", "changeState"), transitionDuration = 250;
        xAxis.orient("bottom").tickPadding(7);
        yAxis.orient(rightAlignYAxis ? "right" : "left");
        var showTooltip = function(e, offsetElement) {
            var left = e.pos[0] + (offsetElement.offsetLeft || 0), top = e.pos[1] + (offsetElement.offsetTop || 0), x = xAxis.tickFormat()(lines.x()(e.point, e.pointIndex)), y = yAxis.tickFormat()(lines.y()(e.point, e.pointIndex)), content = tooltip(e.series.key, x, y, e, chart);
            nv.tooltip.show([ left, top ], content, null, null, offsetElement);
        };
        lines.dispatch.on("elementMouseover.tooltip", function(e) {
            e.pos = [ e.pos[0] + margin.left, e.pos[1] + margin.top ];
            dispatch.tooltipShow(e);
        });
        lines.dispatch.on("elementMouseout.tooltip", function(e) {
            dispatch.tooltipHide(e);
        });
        dispatch.on("tooltipHide", function() {
            tooltips && nv.tooltip.cleanup();
        });
        chart.dispatch = dispatch;
        chart.lines = lines;
        chart.legend = legend;
        chart.xAxis = xAxis;
        chart.yAxis = yAxis;
        chart.interactiveLayer = interactiveLayer;
        d3.rebind(chart, lines, "defined", "isArea", "x", "y", "size", "xScale", "yScale", "xDomain", "yDomain", "xRange", "yRange", "forceX", "forceY", "interactive", "clipEdge", "clipVoronoi", "useVoronoi", "id", "interpolate");
        chart.options = nv.utils.optionsFunc.bind(chart);
        chart.margin = function(_) {
            if (!arguments.length) return margin;
            margin.top = "undefined" != typeof _.top ? _.top : margin.top;
            margin.right = "undefined" != typeof _.right ? _.right : margin.right;
            margin.bottom = "undefined" != typeof _.bottom ? _.bottom : margin.bottom;
            margin.left = "undefined" != typeof _.left ? _.left : margin.left;
            return chart;
        };
        chart.width = function(_) {
            if (!arguments.length) return width;
            width = _;
            return chart;
        };
        chart.height = function(_) {
            if (!arguments.length) return height;
            height = _;
            return chart;
        };
        chart.color = function(_) {
            if (!arguments.length) return color;
            color = nv.utils.getColor(_);
            legend.color(color);
            return chart;
        };
        chart.showLegend = function(_) {
            if (!arguments.length) return showLegend;
            showLegend = _;
            return chart;
        };
        chart.showXAxis = function(_) {
            if (!arguments.length) return showXAxis;
            showXAxis = _;
            return chart;
        };
        chart.showYAxis = function(_) {
            if (!arguments.length) return showYAxis;
            showYAxis = _;
            return chart;
        };
        chart.rightAlignYAxis = function(_) {
            if (!arguments.length) return rightAlignYAxis;
            rightAlignYAxis = _;
            yAxis.orient(_ ? "right" : "left");
            return chart;
        };
        chart.useInteractiveGuideline = function(_) {
            if (!arguments.length) return useInteractiveGuideline;
            useInteractiveGuideline = _;
            if (true === _) {
                chart.interactive(false);
                chart.useVoronoi(false);
            }
            return chart;
        };
        chart.tooltips = function(_) {
            if (!arguments.length) return tooltips;
            tooltips = _;
            return chart;
        };
        chart.tooltipContent = function(_) {
            if (!arguments.length) return tooltip;
            tooltip = _;
            return chart;
        };
        chart.state = function(_) {
            if (!arguments.length) return state;
            state = _;
            return chart;
        };
        chart.defaultState = function(_) {
            if (!arguments.length) return defaultState;
            defaultState = _;
            return chart;
        };
        chart.noData = function(_) {
            if (!arguments.length) return noData;
            noData = _;
            return chart;
        };
        chart.transitionDuration = function(_) {
            if (!arguments.length) return transitionDuration;
            transitionDuration = _;
            return chart;
        };
        return chart;
    };
    nv.models.linePlusBarChart = function() {
        "use strict";
        function chart(selection) {
            selection.each(function(data) {
                var container = d3.select(this), that = this;
                var availableWidth = (width || parseInt(container.style("width")) || 960) - margin.left - margin.right, availableHeight = (height || parseInt(container.style("height")) || 400) - margin.top - margin.bottom;
                chart.update = function() {
                    container.transition().call(chart);
                };
                state.disabled = data.map(function(d) {
                    return !!d.disabled;
                });
                if (!defaultState) {
                    var key;
                    defaultState = {};
                    for (key in state) defaultState[key] = state[key] instanceof Array ? state[key].slice(0) : state[key];
                }
                if (!(data && data.length && data.filter(function(d) {
                    return d.values.length;
                }).length)) {
                    var noDataText = container.selectAll(".nv-noData").data([ noData ]);
                    noDataText.enter().append("text").attr("class", "nvd3 nv-noData").attr("dy", "-.7em").style("text-anchor", "middle");
                    noDataText.attr("x", margin.left + availableWidth / 2).attr("y", margin.top + availableHeight / 2).text(function(d) {
                        return d;
                    });
                    return chart;
                }
                container.selectAll(".nv-noData").remove();
                var dataBars = data.filter(function(d) {
                    return !d.disabled && d.bar;
                });
                var dataLines = data.filter(function(d) {
                    return !d.bar;
                });
                x = dataLines.filter(function(d) {
                    return !d.disabled;
                }).length && dataLines.filter(function(d) {
                    return !d.disabled;
                })[0].values.length ? lines.xScale() : bars.xScale();
                y1 = bars.yScale();
                y2 = lines.yScale();
                var wrap = d3.select(this).selectAll("g.nv-wrap.nv-linePlusBar").data([ data ]);
                var gEnter = wrap.enter().append("g").attr("class", "nvd3 nv-wrap nv-linePlusBar").append("g");
                var g = wrap.select("g");
                gEnter.append("g").attr("class", "nv-x nv-axis");
                gEnter.append("g").attr("class", "nv-y1 nv-axis");
                gEnter.append("g").attr("class", "nv-y2 nv-axis");
                gEnter.append("g").attr("class", "nv-barsWrap");
                gEnter.append("g").attr("class", "nv-linesWrap");
                gEnter.append("g").attr("class", "nv-legendWrap");
                if (showLegend) {
                    legend.width(availableWidth / 2);
                    g.select(".nv-legendWrap").datum(data.map(function(series) {
                        series.originalKey = void 0 === series.originalKey ? series.key : series.originalKey;
                        series.key = series.originalKey + (series.bar ? " (left axis)" : " (right axis)");
                        return series;
                    })).call(legend);
                    if (margin.top != legend.height()) {
                        margin.top = legend.height();
                        availableHeight = (height || parseInt(container.style("height")) || 400) - margin.top - margin.bottom;
                    }
                    g.select(".nv-legendWrap").attr("transform", "translate(" + availableWidth / 2 + "," + -margin.top + ")");
                }
                wrap.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                lines.width(availableWidth).height(availableHeight).color(data.map(function(d, i) {
                    return d.color || color(d, i);
                }).filter(function(d, i) {
                    return !data[i].disabled && !data[i].bar;
                }));
                bars.width(availableWidth).height(availableHeight).color(data.map(function(d, i) {
                    return d.color || color(d, i);
                }).filter(function(d, i) {
                    return !data[i].disabled && data[i].bar;
                }));
                var barsWrap = g.select(".nv-barsWrap").datum(dataBars.length ? dataBars : [ {
                    values: []
                } ]);
                var linesWrap = g.select(".nv-linesWrap").datum(dataLines[0] && !dataLines[0].disabled ? dataLines : [ {
                    values: []
                } ]);
                d3.transition(barsWrap).call(bars);
                d3.transition(linesWrap).call(lines);
                xAxis.scale(x).ticks(availableWidth / 100).tickSize(-availableHeight, 0);
                g.select(".nv-x.nv-axis").attr("transform", "translate(0," + y1.range()[0] + ")");
                d3.transition(g.select(".nv-x.nv-axis")).call(xAxis);
                y1Axis.scale(y1).ticks(availableHeight / 36).tickSize(-availableWidth, 0);
                d3.transition(g.select(".nv-y1.nv-axis")).style("opacity", dataBars.length ? 1 : 0).call(y1Axis);
                y2Axis.scale(y2).ticks(availableHeight / 36).tickSize(dataBars.length ? 0 : -availableWidth, 0);
                g.select(".nv-y2.nv-axis").style("opacity", dataLines.length ? 1 : 0).attr("transform", "translate(" + availableWidth + ",0)");
                d3.transition(g.select(".nv-y2.nv-axis")).call(y2Axis);
                legend.dispatch.on("stateChange", function(newState) {
                    state = newState;
                    dispatch.stateChange(state);
                    chart.update();
                });
                dispatch.on("tooltipShow", function(e) {
                    tooltips && showTooltip(e, that.parentNode);
                });
                dispatch.on("changeState", function(e) {
                    if ("undefined" != typeof e.disabled) {
                        data.forEach(function(series, i) {
                            series.disabled = e.disabled[i];
                        });
                        state.disabled = e.disabled;
                    }
                    chart.update();
                });
            });
            return chart;
        }
        var lines = nv.models.line(), bars = nv.models.historicalBar(), xAxis = nv.models.axis(), y1Axis = nv.models.axis(), y2Axis = nv.models.axis(), legend = nv.models.legend();
        var x, y1, y2, margin = {
            top: 30,
            right: 60,
            bottom: 50,
            left: 60
        }, width = null, height = null, getX = function(d) {
            return d.x;
        }, getY = function(d) {
            return d.y;
        }, color = nv.utils.defaultColor(), showLegend = true, tooltips = true, tooltip = function(key, x, y) {
            return "<h3>" + key + "</h3>" + "<p>" + y + " at " + x + "</p>";
        }, state = {}, defaultState = null, noData = "No Data Available.", dispatch = d3.dispatch("tooltipShow", "tooltipHide", "stateChange", "changeState");
        bars.padData(true);
        lines.clipEdge(false).padData(true);
        xAxis.orient("bottom").tickPadding(7).highlightZero(false);
        y1Axis.orient("left");
        y2Axis.orient("right");
        var showTooltip = function(e, offsetElement) {
            var left = e.pos[0] + (offsetElement.offsetLeft || 0), top = e.pos[1] + (offsetElement.offsetTop || 0), x = xAxis.tickFormat()(lines.x()(e.point, e.pointIndex)), y = (e.series.bar ? y1Axis : y2Axis).tickFormat()(lines.y()(e.point, e.pointIndex)), content = tooltip(e.series.key, x, y, e, chart);
            nv.tooltip.show([ left, top ], content, 0 > e.value ? "n" : "s", null, offsetElement);
        };
        lines.dispatch.on("elementMouseover.tooltip", function(e) {
            e.pos = [ e.pos[0] + margin.left, e.pos[1] + margin.top ];
            dispatch.tooltipShow(e);
        });
        lines.dispatch.on("elementMouseout.tooltip", function(e) {
            dispatch.tooltipHide(e);
        });
        bars.dispatch.on("elementMouseover.tooltip", function(e) {
            e.pos = [ e.pos[0] + margin.left, e.pos[1] + margin.top ];
            dispatch.tooltipShow(e);
        });
        bars.dispatch.on("elementMouseout.tooltip", function(e) {
            dispatch.tooltipHide(e);
        });
        dispatch.on("tooltipHide", function() {
            tooltips && nv.tooltip.cleanup();
        });
        chart.dispatch = dispatch;
        chart.legend = legend;
        chart.lines = lines;
        chart.bars = bars;
        chart.xAxis = xAxis;
        chart.y1Axis = y1Axis;
        chart.y2Axis = y2Axis;
        d3.rebind(chart, lines, "defined", "size", "clipVoronoi", "interpolate");
        chart.options = nv.utils.optionsFunc.bind(chart);
        chart.x = function(_) {
            if (!arguments.length) return getX;
            getX = _;
            lines.x(_);
            bars.x(_);
            return chart;
        };
        chart.y = function(_) {
            if (!arguments.length) return getY;
            getY = _;
            lines.y(_);
            bars.y(_);
            return chart;
        };
        chart.margin = function(_) {
            if (!arguments.length) return margin;
            margin.top = "undefined" != typeof _.top ? _.top : margin.top;
            margin.right = "undefined" != typeof _.right ? _.right : margin.right;
            margin.bottom = "undefined" != typeof _.bottom ? _.bottom : margin.bottom;
            margin.left = "undefined" != typeof _.left ? _.left : margin.left;
            return chart;
        };
        chart.width = function(_) {
            if (!arguments.length) return width;
            width = _;
            return chart;
        };
        chart.height = function(_) {
            if (!arguments.length) return height;
            height = _;
            return chart;
        };
        chart.color = function(_) {
            if (!arguments.length) return color;
            color = nv.utils.getColor(_);
            legend.color(color);
            return chart;
        };
        chart.showLegend = function(_) {
            if (!arguments.length) return showLegend;
            showLegend = _;
            return chart;
        };
        chart.tooltips = function(_) {
            if (!arguments.length) return tooltips;
            tooltips = _;
            return chart;
        };
        chart.tooltipContent = function(_) {
            if (!arguments.length) return tooltip;
            tooltip = _;
            return chart;
        };
        chart.state = function(_) {
            if (!arguments.length) return state;
            state = _;
            return chart;
        };
        chart.defaultState = function(_) {
            if (!arguments.length) return defaultState;
            defaultState = _;
            return chart;
        };
        chart.noData = function(_) {
            if (!arguments.length) return noData;
            noData = _;
            return chart;
        };
        return chart;
    };
    nv.models.lineWithFocusChart = function() {
        "use strict";
        function chart(selection) {
            selection.each(function(data) {
                function resizePath(d) {
                    var e = +("e" == d), x = e ? 1 : -1, y = availableHeight2 / 3;
                    return "M" + .5 * x + "," + y + "A6,6 0 0 " + e + " " + 6.5 * x + "," + (y + 6) + "V" + (2 * y - 6) + "A6,6 0 0 " + e + " " + .5 * x + "," + 2 * y + "Z" + "M" + 2.5 * x + "," + (y + 8) + "V" + (2 * y - 8) + "M" + 4.5 * x + "," + (y + 8) + "V" + (2 * y - 8);
                }
                function updateBrushBG() {
                    brush.empty() || brush.extent(brushExtent);
                    brushBG.data([ brush.empty() ? x2.domain() : brushExtent ]).each(function(d) {
                        var leftWidth = x2(d[0]) - x.range()[0], rightWidth = x.range()[1] - x2(d[1]);
                        d3.select(this).select(".left").attr("width", 0 > leftWidth ? 0 : leftWidth);
                        d3.select(this).select(".right").attr("x", x2(d[1])).attr("width", 0 > rightWidth ? 0 : rightWidth);
                    });
                }
                function onBrush() {
                    brushExtent = brush.empty() ? null : brush.extent();
                    var extent = brush.empty() ? x2.domain() : brush.extent();
                    if (1 >= Math.abs(extent[0] - extent[1])) return;
                    dispatch.brush({
                        extent: extent,
                        brush: brush
                    });
                    updateBrushBG();
                    var focusLinesWrap = g.select(".nv-focus .nv-linesWrap").datum(data.filter(function(d) {
                        return !d.disabled;
                    }).map(function(d) {
                        return {
                            key: d.key,
                            values: d.values.filter(function(d, i) {
                                return lines.x()(d, i) >= extent[0] && lines.x()(d, i) <= extent[1];
                            })
                        };
                    }));
                    focusLinesWrap.transition().duration(transitionDuration).call(lines);
                    g.select(".nv-focus .nv-x.nv-axis").transition().duration(transitionDuration).call(xAxis);
                    g.select(".nv-focus .nv-y.nv-axis").transition().duration(transitionDuration).call(yAxis);
                }
                var container = d3.select(this), that = this;
                var availableWidth = (width || parseInt(container.style("width")) || 960) - margin.left - margin.right, availableHeight1 = (height || parseInt(container.style("height")) || 400) - margin.top - margin.bottom - height2, availableHeight2 = height2 - margin2.top - margin2.bottom;
                chart.update = function() {
                    container.transition().duration(transitionDuration).call(chart);
                };
                chart.container = this;
                if (!(data && data.length && data.filter(function(d) {
                    return d.values.length;
                }).length)) {
                    var noDataText = container.selectAll(".nv-noData").data([ noData ]);
                    noDataText.enter().append("text").attr("class", "nvd3 nv-noData").attr("dy", "-.7em").style("text-anchor", "middle");
                    noDataText.attr("x", margin.left + availableWidth / 2).attr("y", margin.top + availableHeight1 / 2).text(function(d) {
                        return d;
                    });
                    return chart;
                }
                container.selectAll(".nv-noData").remove();
                x = lines.xScale();
                y = lines.yScale();
                x2 = lines2.xScale();
                y2 = lines2.yScale();
                var wrap = container.selectAll("g.nv-wrap.nv-lineWithFocusChart").data([ data ]);
                var gEnter = wrap.enter().append("g").attr("class", "nvd3 nv-wrap nv-lineWithFocusChart").append("g");
                var g = wrap.select("g");
                gEnter.append("g").attr("class", "nv-legendWrap");
                var focusEnter = gEnter.append("g").attr("class", "nv-focus");
                focusEnter.append("g").attr("class", "nv-x nv-axis");
                focusEnter.append("g").attr("class", "nv-y nv-axis");
                focusEnter.append("g").attr("class", "nv-linesWrap");
                var contextEnter = gEnter.append("g").attr("class", "nv-context");
                contextEnter.append("g").attr("class", "nv-x nv-axis");
                contextEnter.append("g").attr("class", "nv-y nv-axis");
                contextEnter.append("g").attr("class", "nv-linesWrap");
                contextEnter.append("g").attr("class", "nv-brushBackground");
                contextEnter.append("g").attr("class", "nv-x nv-brush");
                if (showLegend) {
                    legend.width(availableWidth);
                    g.select(".nv-legendWrap").datum(data).call(legend);
                    if (margin.top != legend.height()) {
                        margin.top = legend.height();
                        availableHeight1 = (height || parseInt(container.style("height")) || 400) - margin.top - margin.bottom - height2;
                    }
                    g.select(".nv-legendWrap").attr("transform", "translate(0," + -margin.top + ")");
                }
                wrap.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                lines.width(availableWidth).height(availableHeight1).color(data.map(function(d, i) {
                    return d.color || color(d, i);
                }).filter(function(d, i) {
                    return !data[i].disabled;
                }));
                lines2.defined(lines.defined()).width(availableWidth).height(availableHeight2).color(data.map(function(d, i) {
                    return d.color || color(d, i);
                }).filter(function(d, i) {
                    return !data[i].disabled;
                }));
                g.select(".nv-context").attr("transform", "translate(0," + (availableHeight1 + margin.bottom + margin2.top) + ")");
                var contextLinesWrap = g.select(".nv-context .nv-linesWrap").datum(data.filter(function(d) {
                    return !d.disabled;
                }));
                d3.transition(contextLinesWrap).call(lines2);
                xAxis.scale(x).ticks(availableWidth / 100).tickSize(-availableHeight1, 0);
                yAxis.scale(y).ticks(availableHeight1 / 36).tickSize(-availableWidth, 0);
                g.select(".nv-focus .nv-x.nv-axis").attr("transform", "translate(0," + availableHeight1 + ")");
                brush.x(x2).on("brush", function() {
                    var oldTransition = chart.transitionDuration();
                    chart.transitionDuration(0);
                    onBrush();
                    chart.transitionDuration(oldTransition);
                });
                brushExtent && brush.extent(brushExtent);
                var brushBG = g.select(".nv-brushBackground").selectAll("g").data([ brushExtent || brush.extent() ]);
                var brushBGenter = brushBG.enter().append("g");
                brushBGenter.append("rect").attr("class", "left").attr("x", 0).attr("y", 0).attr("height", availableHeight2);
                brushBGenter.append("rect").attr("class", "right").attr("x", 0).attr("y", 0).attr("height", availableHeight2);
                var gBrush = g.select(".nv-x.nv-brush").call(brush);
                gBrush.selectAll("rect").attr("height", availableHeight2);
                gBrush.selectAll(".resize").append("path").attr("d", resizePath);
                onBrush();
                x2Axis.scale(x2).ticks(availableWidth / 100).tickSize(-availableHeight2, 0);
                g.select(".nv-context .nv-x.nv-axis").attr("transform", "translate(0," + y2.range()[0] + ")");
                d3.transition(g.select(".nv-context .nv-x.nv-axis")).call(x2Axis);
                y2Axis.scale(y2).ticks(availableHeight2 / 36).tickSize(-availableWidth, 0);
                d3.transition(g.select(".nv-context .nv-y.nv-axis")).call(y2Axis);
                g.select(".nv-context .nv-x.nv-axis").attr("transform", "translate(0," + y2.range()[0] + ")");
                legend.dispatch.on("stateChange", function() {
                    chart.update();
                });
                dispatch.on("tooltipShow", function(e) {
                    tooltips && showTooltip(e, that.parentNode);
                });
            });
            return chart;
        }
        var lines = nv.models.line(), lines2 = nv.models.line(), xAxis = nv.models.axis(), yAxis = nv.models.axis(), x2Axis = nv.models.axis(), y2Axis = nv.models.axis(), legend = nv.models.legend(), brush = d3.svg.brush();
        var x, y, x2, y2, margin = {
            top: 30,
            right: 30,
            bottom: 30,
            left: 60
        }, margin2 = {
            top: 0,
            right: 30,
            bottom: 20,
            left: 60
        }, color = nv.utils.defaultColor(), width = null, height = null, height2 = 100, showLegend = true, brushExtent = null, tooltips = true, tooltip = function(key, x, y) {
            return "<h3>" + key + "</h3>" + "<p>" + y + " at " + x + "</p>";
        }, noData = "No Data Available.", dispatch = d3.dispatch("tooltipShow", "tooltipHide", "brush"), transitionDuration = 250;
        lines.clipEdge(true);
        lines2.interactive(false);
        xAxis.orient("bottom").tickPadding(5);
        yAxis.orient("left");
        x2Axis.orient("bottom").tickPadding(5);
        y2Axis.orient("left");
        var showTooltip = function(e, offsetElement) {
            var left = e.pos[0] + (offsetElement.offsetLeft || 0), top = e.pos[1] + (offsetElement.offsetTop || 0), x = xAxis.tickFormat()(lines.x()(e.point, e.pointIndex)), y = yAxis.tickFormat()(lines.y()(e.point, e.pointIndex)), content = tooltip(e.series.key, x, y, e, chart);
            nv.tooltip.show([ left, top ], content, null, null, offsetElement);
        };
        lines.dispatch.on("elementMouseover.tooltip", function(e) {
            e.pos = [ e.pos[0] + margin.left, e.pos[1] + margin.top ];
            dispatch.tooltipShow(e);
        });
        lines.dispatch.on("elementMouseout.tooltip", function(e) {
            dispatch.tooltipHide(e);
        });
        dispatch.on("tooltipHide", function() {
            tooltips && nv.tooltip.cleanup();
        });
        chart.dispatch = dispatch;
        chart.legend = legend;
        chart.lines = lines;
        chart.lines2 = lines2;
        chart.xAxis = xAxis;
        chart.yAxis = yAxis;
        chart.x2Axis = x2Axis;
        chart.y2Axis = y2Axis;
        d3.rebind(chart, lines, "defined", "isArea", "size", "xDomain", "yDomain", "xRange", "yRange", "forceX", "forceY", "interactive", "clipEdge", "clipVoronoi", "id");
        chart.options = nv.utils.optionsFunc.bind(chart);
        chart.x = function(_) {
            if (!arguments.length) return lines.x;
            lines.x(_);
            lines2.x(_);
            return chart;
        };
        chart.y = function(_) {
            if (!arguments.length) return lines.y;
            lines.y(_);
            lines2.y(_);
            return chart;
        };
        chart.margin = function(_) {
            if (!arguments.length) return margin;
            margin.top = "undefined" != typeof _.top ? _.top : margin.top;
            margin.right = "undefined" != typeof _.right ? _.right : margin.right;
            margin.bottom = "undefined" != typeof _.bottom ? _.bottom : margin.bottom;
            margin.left = "undefined" != typeof _.left ? _.left : margin.left;
            return chart;
        };
        chart.margin2 = function(_) {
            if (!arguments.length) return margin2;
            margin2 = _;
            return chart;
        };
        chart.width = function(_) {
            if (!arguments.length) return width;
            width = _;
            return chart;
        };
        chart.height = function(_) {
            if (!arguments.length) return height;
            height = _;
            return chart;
        };
        chart.height2 = function(_) {
            if (!arguments.length) return height2;
            height2 = _;
            return chart;
        };
        chart.color = function(_) {
            if (!arguments.length) return color;
            color = nv.utils.getColor(_);
            legend.color(color);
            return chart;
        };
        chart.showLegend = function(_) {
            if (!arguments.length) return showLegend;
            showLegend = _;
            return chart;
        };
        chart.tooltips = function(_) {
            if (!arguments.length) return tooltips;
            tooltips = _;
            return chart;
        };
        chart.tooltipContent = function(_) {
            if (!arguments.length) return tooltip;
            tooltip = _;
            return chart;
        };
        chart.interpolate = function(_) {
            if (!arguments.length) return lines.interpolate();
            lines.interpolate(_);
            lines2.interpolate(_);
            return chart;
        };
        chart.noData = function(_) {
            if (!arguments.length) return noData;
            noData = _;
            return chart;
        };
        chart.xTickFormat = function(_) {
            if (!arguments.length) return xAxis.tickFormat();
            xAxis.tickFormat(_);
            x2Axis.tickFormat(_);
            return chart;
        };
        chart.yTickFormat = function(_) {
            if (!arguments.length) return yAxis.tickFormat();
            yAxis.tickFormat(_);
            y2Axis.tickFormat(_);
            return chart;
        };
        chart.brushExtent = function(_) {
            if (!arguments.length) return brushExtent;
            brushExtent = _;
            return chart;
        };
        chart.transitionDuration = function(_) {
            if (!arguments.length) return transitionDuration;
            transitionDuration = _;
            return chart;
        };
        return chart;
    };
    nv.models.linePlusBarWithFocusChart = function() {
        "use strict";
        function chart(selection) {
            selection.each(function(data) {
                function resizePath(d) {
                    var e = +("e" == d), x = e ? 1 : -1, y = availableHeight2 / 3;
                    return "M" + .5 * x + "," + y + "A6,6 0 0 " + e + " " + 6.5 * x + "," + (y + 6) + "V" + (2 * y - 6) + "A6,6 0 0 " + e + " " + .5 * x + "," + 2 * y + "Z" + "M" + 2.5 * x + "," + (y + 8) + "V" + (2 * y - 8) + "M" + 4.5 * x + "," + (y + 8) + "V" + (2 * y - 8);
                }
                function updateBrushBG() {
                    brush.empty() || brush.extent(brushExtent);
                    brushBG.data([ brush.empty() ? x2.domain() : brushExtent ]).each(function(d) {
                        var leftWidth = x2(d[0]) - x2.range()[0], rightWidth = x2.range()[1] - x2(d[1]);
                        d3.select(this).select(".left").attr("width", 0 > leftWidth ? 0 : leftWidth);
                        d3.select(this).select(".right").attr("x", x2(d[1])).attr("width", 0 > rightWidth ? 0 : rightWidth);
                    });
                }
                function onBrush() {
                    brushExtent = brush.empty() ? null : brush.extent();
                    extent = brush.empty() ? x2.domain() : brush.extent();
                    dispatch.brush({
                        extent: extent,
                        brush: brush
                    });
                    updateBrushBG();
                    bars.width(availableWidth).height(availableHeight1).color(data.map(function(d, i) {
                        return d.color || color(d, i);
                    }).filter(function(d, i) {
                        return !data[i].disabled && data[i].bar;
                    }));
                    lines.width(availableWidth).height(availableHeight1).color(data.map(function(d, i) {
                        return d.color || color(d, i);
                    }).filter(function(d, i) {
                        return !data[i].disabled && !data[i].bar;
                    }));
                    var focusBarsWrap = g.select(".nv-focus .nv-barsWrap").datum(dataBars.length ? dataBars.map(function(d) {
                        return {
                            key: d.key,
                            values: d.values.filter(function(d, i) {
                                return bars.x()(d, i) >= extent[0] && bars.x()(d, i) <= extent[1];
                            })
                        };
                    }) : [ {
                        values: []
                    } ]);
                    var focusLinesWrap = g.select(".nv-focus .nv-linesWrap").datum(dataLines[0].disabled ? [ {
                        values: []
                    } ] : dataLines.map(function(d) {
                        return {
                            key: d.key,
                            values: d.values.filter(function(d, i) {
                                return lines.x()(d, i) >= extent[0] && lines.x()(d, i) <= extent[1];
                            })
                        };
                    }));
                    x = dataBars.length ? bars.xScale() : lines.xScale();
                    xAxis.scale(x).ticks(availableWidth / 100).tickSize(-availableHeight1, 0);
                    xAxis.domain([ Math.ceil(extent[0]), Math.floor(extent[1]) ]);
                    g.select(".nv-x.nv-axis").transition().duration(transitionDuration).call(xAxis);
                    focusBarsWrap.transition().duration(transitionDuration).call(bars);
                    focusLinesWrap.transition().duration(transitionDuration).call(lines);
                    g.select(".nv-focus .nv-x.nv-axis").attr("transform", "translate(0," + y1.range()[0] + ")");
                    y1Axis.scale(y1).ticks(availableHeight1 / 36).tickSize(-availableWidth, 0);
                    g.select(".nv-focus .nv-y1.nv-axis").style("opacity", dataBars.length ? 1 : 0);
                    y2Axis.scale(y2).ticks(availableHeight1 / 36).tickSize(dataBars.length ? 0 : -availableWidth, 0);
                    g.select(".nv-focus .nv-y2.nv-axis").style("opacity", dataLines.length ? 1 : 0).attr("transform", "translate(" + x.range()[1] + ",0)");
                    g.select(".nv-focus .nv-y1.nv-axis").transition().duration(transitionDuration).call(y1Axis);
                    g.select(".nv-focus .nv-y2.nv-axis").transition().duration(transitionDuration).call(y2Axis);
                }
                var container = d3.select(this), that = this;
                var availableWidth = (width || parseInt(container.style("width")) || 960) - margin.left - margin.right, availableHeight1 = (height || parseInt(container.style("height")) || 400) - margin.top - margin.bottom - height2, availableHeight2 = height2 - margin2.top - margin2.bottom;
                chart.update = function() {
                    container.transition().duration(transitionDuration).call(chart);
                };
                chart.container = this;
                if (!(data && data.length && data.filter(function(d) {
                    return d.values.length;
                }).length)) {
                    var noDataText = container.selectAll(".nv-noData").data([ noData ]);
                    noDataText.enter().append("text").attr("class", "nvd3 nv-noData").attr("dy", "-.7em").style("text-anchor", "middle");
                    noDataText.attr("x", margin.left + availableWidth / 2).attr("y", margin.top + availableHeight1 / 2).text(function(d) {
                        return d;
                    });
                    return chart;
                }
                container.selectAll(".nv-noData").remove();
                var dataBars = data.filter(function(d) {
                    return !d.disabled && d.bar;
                });
                var dataLines = data.filter(function(d) {
                    return !d.bar;
                });
                x = bars.xScale();
                x2 = x2Axis.scale();
                y1 = bars.yScale();
                y2 = lines.yScale();
                y3 = bars2.yScale();
                y4 = lines2.yScale();
                var series1 = data.filter(function(d) {
                    return !d.disabled && d.bar;
                }).map(function(d) {
                    return d.values.map(function(d, i) {
                        return {
                            x: getX(d, i),
                            y: getY(d, i)
                        };
                    });
                });
                var series2 = data.filter(function(d) {
                    return !d.disabled && !d.bar;
                }).map(function(d) {
                    return d.values.map(function(d, i) {
                        return {
                            x: getX(d, i),
                            y: getY(d, i)
                        };
                    });
                });
                x.range([ 0, availableWidth ]);
                x2.domain(d3.extent(d3.merge(series1.concat(series2)), function(d) {
                    return d.x;
                })).range([ 0, availableWidth ]);
                var wrap = container.selectAll("g.nv-wrap.nv-linePlusBar").data([ data ]);
                var gEnter = wrap.enter().append("g").attr("class", "nvd3 nv-wrap nv-linePlusBar").append("g");
                var g = wrap.select("g");
                gEnter.append("g").attr("class", "nv-legendWrap");
                var focusEnter = gEnter.append("g").attr("class", "nv-focus");
                focusEnter.append("g").attr("class", "nv-x nv-axis");
                focusEnter.append("g").attr("class", "nv-y1 nv-axis");
                focusEnter.append("g").attr("class", "nv-y2 nv-axis");
                focusEnter.append("g").attr("class", "nv-barsWrap");
                focusEnter.append("g").attr("class", "nv-linesWrap");
                var contextEnter = gEnter.append("g").attr("class", "nv-context");
                contextEnter.append("g").attr("class", "nv-x nv-axis");
                contextEnter.append("g").attr("class", "nv-y1 nv-axis");
                contextEnter.append("g").attr("class", "nv-y2 nv-axis");
                contextEnter.append("g").attr("class", "nv-barsWrap");
                contextEnter.append("g").attr("class", "nv-linesWrap");
                contextEnter.append("g").attr("class", "nv-brushBackground");
                contextEnter.append("g").attr("class", "nv-x nv-brush");
                if (showLegend) {
                    legend.width(availableWidth / 2);
                    g.select(".nv-legendWrap").datum(data.map(function(series) {
                        series.originalKey = void 0 === series.originalKey ? series.key : series.originalKey;
                        series.key = series.originalKey + (series.bar ? " (left axis)" : " (right axis)");
                        return series;
                    })).call(legend);
                    if (margin.top != legend.height()) {
                        margin.top = legend.height();
                        availableHeight1 = (height || parseInt(container.style("height")) || 400) - margin.top - margin.bottom - height2;
                    }
                    g.select(".nv-legendWrap").attr("transform", "translate(" + availableWidth / 2 + "," + -margin.top + ")");
                }
                wrap.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                bars2.width(availableWidth).height(availableHeight2).color(data.map(function(d, i) {
                    return d.color || color(d, i);
                }).filter(function(d, i) {
                    return !data[i].disabled && data[i].bar;
                }));
                lines2.width(availableWidth).height(availableHeight2).color(data.map(function(d, i) {
                    return d.color || color(d, i);
                }).filter(function(d, i) {
                    return !data[i].disabled && !data[i].bar;
                }));
                var bars2Wrap = g.select(".nv-context .nv-barsWrap").datum(dataBars.length ? dataBars : [ {
                    values: []
                } ]);
                var lines2Wrap = g.select(".nv-context .nv-linesWrap").datum(dataLines[0].disabled ? [ {
                    values: []
                } ] : dataLines);
                g.select(".nv-context").attr("transform", "translate(0," + (availableHeight1 + margin.bottom + margin2.top) + ")");
                bars2Wrap.transition().call(bars2);
                lines2Wrap.transition().call(lines2);
                brush.x(x2).on("brush", onBrush);
                brushExtent && brush.extent(brushExtent);
                var brushBG = g.select(".nv-brushBackground").selectAll("g").data([ brushExtent || brush.extent() ]);
                var brushBGenter = brushBG.enter().append("g");
                brushBGenter.append("rect").attr("class", "left").attr("x", 0).attr("y", 0).attr("height", availableHeight2);
                brushBGenter.append("rect").attr("class", "right").attr("x", 0).attr("y", 0).attr("height", availableHeight2);
                var gBrush = g.select(".nv-x.nv-brush").call(brush);
                gBrush.selectAll("rect").attr("height", availableHeight2);
                gBrush.selectAll(".resize").append("path").attr("d", resizePath);
                x2Axis.ticks(availableWidth / 100).tickSize(-availableHeight2, 0);
                g.select(".nv-context .nv-x.nv-axis").attr("transform", "translate(0," + y3.range()[0] + ")");
                g.select(".nv-context .nv-x.nv-axis").transition().call(x2Axis);
                y3Axis.scale(y3).ticks(availableHeight2 / 36).tickSize(-availableWidth, 0);
                g.select(".nv-context .nv-y1.nv-axis").style("opacity", dataBars.length ? 1 : 0).attr("transform", "translate(0," + x2.range()[0] + ")");
                g.select(".nv-context .nv-y1.nv-axis").transition().call(y3Axis);
                y4Axis.scale(y4).ticks(availableHeight2 / 36).tickSize(dataBars.length ? 0 : -availableWidth, 0);
                g.select(".nv-context .nv-y2.nv-axis").style("opacity", dataLines.length ? 1 : 0).attr("transform", "translate(" + x2.range()[1] + ",0)");
                g.select(".nv-context .nv-y2.nv-axis").transition().call(y4Axis);
                legend.dispatch.on("stateChange", function() {
                    chart.update();
                });
                dispatch.on("tooltipShow", function(e) {
                    tooltips && showTooltip(e, that.parentNode);
                });
                onBrush();
            });
            return chart;
        }
        var lines = nv.models.line(), lines2 = nv.models.line(), bars = nv.models.historicalBar(), bars2 = nv.models.historicalBar(), xAxis = nv.models.axis(), x2Axis = nv.models.axis(), y1Axis = nv.models.axis(), y2Axis = nv.models.axis(), y3Axis = nv.models.axis(), y4Axis = nv.models.axis(), legend = nv.models.legend(), brush = d3.svg.brush();
        var extent, x, x2, y1, y2, y3, y4, margin = {
            top: 30,
            right: 30,
            bottom: 30,
            left: 60
        }, margin2 = {
            top: 0,
            right: 30,
            bottom: 20,
            left: 60
        }, width = null, height = null, height2 = 100, getX = function(d) {
            return d.x;
        }, getY = function(d) {
            return d.y;
        }, color = nv.utils.defaultColor(), showLegend = true, brushExtent = null, tooltips = true, tooltip = function(key, x, y) {
            return "<h3>" + key + "</h3>" + "<p>" + y + " at " + x + "</p>";
        }, noData = "No Data Available.", dispatch = d3.dispatch("tooltipShow", "tooltipHide", "brush"), transitionDuration = 0;
        lines.clipEdge(true);
        lines2.interactive(false);
        xAxis.orient("bottom").tickPadding(5);
        y1Axis.orient("left");
        y2Axis.orient("right");
        x2Axis.orient("bottom").tickPadding(5);
        y3Axis.orient("left");
        y4Axis.orient("right");
        var showTooltip = function(e, offsetElement) {
            extent && (e.pointIndex += Math.ceil(extent[0]));
            var left = e.pos[0] + (offsetElement.offsetLeft || 0), top = e.pos[1] + (offsetElement.offsetTop || 0), x = xAxis.tickFormat()(lines.x()(e.point, e.pointIndex)), y = (e.series.bar ? y1Axis : y2Axis).tickFormat()(lines.y()(e.point, e.pointIndex)), content = tooltip(e.series.key, x, y, e, chart);
            nv.tooltip.show([ left, top ], content, 0 > e.value ? "n" : "s", null, offsetElement);
        };
        lines.dispatch.on("elementMouseover.tooltip", function(e) {
            e.pos = [ e.pos[0] + margin.left, e.pos[1] + margin.top ];
            dispatch.tooltipShow(e);
        });
        lines.dispatch.on("elementMouseout.tooltip", function(e) {
            dispatch.tooltipHide(e);
        });
        bars.dispatch.on("elementMouseover.tooltip", function(e) {
            e.pos = [ e.pos[0] + margin.left, e.pos[1] + margin.top ];
            dispatch.tooltipShow(e);
        });
        bars.dispatch.on("elementMouseout.tooltip", function(e) {
            dispatch.tooltipHide(e);
        });
        dispatch.on("tooltipHide", function() {
            tooltips && nv.tooltip.cleanup();
        });
        chart.dispatch = dispatch;
        chart.legend = legend;
        chart.lines = lines;
        chart.lines2 = lines2;
        chart.bars = bars;
        chart.bars2 = bars2;
        chart.xAxis = xAxis;
        chart.x2Axis = x2Axis;
        chart.y1Axis = y1Axis;
        chart.y2Axis = y2Axis;
        chart.y3Axis = y3Axis;
        chart.y4Axis = y4Axis;
        d3.rebind(chart, lines, "defined", "size", "clipVoronoi", "interpolate");
        chart.options = nv.utils.optionsFunc.bind(chart);
        chart.x = function(_) {
            if (!arguments.length) return getX;
            getX = _;
            lines.x(_);
            bars.x(_);
            return chart;
        };
        chart.y = function(_) {
            if (!arguments.length) return getY;
            getY = _;
            lines.y(_);
            bars.y(_);
            return chart;
        };
        chart.margin = function(_) {
            if (!arguments.length) return margin;
            margin.top = "undefined" != typeof _.top ? _.top : margin.top;
            margin.right = "undefined" != typeof _.right ? _.right : margin.right;
            margin.bottom = "undefined" != typeof _.bottom ? _.bottom : margin.bottom;
            margin.left = "undefined" != typeof _.left ? _.left : margin.left;
            return chart;
        };
        chart.width = function(_) {
            if (!arguments.length) return width;
            width = _;
            return chart;
        };
        chart.height = function(_) {
            if (!arguments.length) return height;
            height = _;
            return chart;
        };
        chart.color = function(_) {
            if (!arguments.length) return color;
            color = nv.utils.getColor(_);
            legend.color(color);
            return chart;
        };
        chart.showLegend = function(_) {
            if (!arguments.length) return showLegend;
            showLegend = _;
            return chart;
        };
        chart.tooltips = function(_) {
            if (!arguments.length) return tooltips;
            tooltips = _;
            return chart;
        };
        chart.tooltipContent = function(_) {
            if (!arguments.length) return tooltip;
            tooltip = _;
            return chart;
        };
        chart.noData = function(_) {
            if (!arguments.length) return noData;
            noData = _;
            return chart;
        };
        chart.brushExtent = function(_) {
            if (!arguments.length) return brushExtent;
            brushExtent = _;
            return chart;
        };
        return chart;
    };
    nv.models.multiBar = function() {
        "use strict";
        function chart(selection) {
            selection.each(function(data) {
                var availableWidth = width - margin.left - margin.right, availableHeight = height - margin.top - margin.bottom, container = d3.select(this);
                hideable && data.length && (hideable = [ {
                    values: data[0].values.map(function(d) {
                        return {
                            x: d.x,
                            y: 0,
                            series: d.series,
                            size: .01
                        };
                    })
                } ]);
                stacked && (data = d3.layout.stack().offset(stackOffset).values(function(d) {
                    return d.values;
                }).y(getY)(!data.length && hideable ? hideable : data));
                data.forEach(function(series, i) {
                    series.values.forEach(function(point) {
                        point.series = i;
                    });
                });
                stacked && data[0].values.map(function(d, i) {
                    var posBase = 0, negBase = 0;
                    data.map(function(d) {
                        var f = d.values[i];
                        f.size = Math.abs(f.y);
                        if (0 > f.y) {
                            f.y1 = negBase;
                            negBase -= f.size;
                        } else {
                            f.y1 = f.size + posBase;
                            posBase += f.size;
                        }
                    });
                });
                var seriesData = xDomain && yDomain ? [] : data.map(function(d) {
                    return d.values.map(function(d, i) {
                        return {
                            x: getX(d, i),
                            y: getY(d, i),
                            y0: d.y0,
                            y1: d.y1
                        };
                    });
                });
                x.domain(xDomain || d3.merge(seriesData).map(function(d) {
                    return d.x;
                })).rangeBands(xRange || [ 0, availableWidth ], groupSpacing);
                y.domain(yDomain || d3.extent(d3.merge(seriesData).map(function(d) {
                    return stacked ? d.y > 0 ? d.y1 : d.y1 + d.y : d.y;
                }).concat(forceY))).range(yRange || [ availableHeight, 0 ]);
                x.domain()[0] === x.domain()[1] && (x.domain()[0] ? x.domain([ x.domain()[0] - .01 * x.domain()[0], x.domain()[1] + .01 * x.domain()[1] ]) : x.domain([ -1, 1 ]));
                y.domain()[0] === y.domain()[1] && (y.domain()[0] ? y.domain([ y.domain()[0] + .01 * y.domain()[0], y.domain()[1] - .01 * y.domain()[1] ]) : y.domain([ -1, 1 ]));
                x0 = x0 || x;
                y0 = y0 || y;
                var wrap = container.selectAll("g.nv-wrap.nv-multibar").data([ data ]);
                var wrapEnter = wrap.enter().append("g").attr("class", "nvd3 nv-wrap nv-multibar");
                var defsEnter = wrapEnter.append("defs");
                var gEnter = wrapEnter.append("g");
                var g = wrap.select("g");
                gEnter.append("g").attr("class", "nv-groups");
                wrap.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                defsEnter.append("clipPath").attr("id", "nv-edge-clip-" + id).append("rect");
                wrap.select("#nv-edge-clip-" + id + " rect").attr("width", availableWidth).attr("height", availableHeight);
                g.attr("clip-path", clipEdge ? "url(#nv-edge-clip-" + id + ")" : "");
                var groups = wrap.select(".nv-groups").selectAll(".nv-group").data(function(d) {
                    return d;
                }, function(d, i) {
                    return i;
                });
                groups.enter().append("g").style("stroke-opacity", 1e-6).style("fill-opacity", 1e-6);
                groups.exit().transition().selectAll("rect.nv-bar").delay(function(d, i) {
                    return i * delay / data[0].values.length;
                }).attr("y", function(d) {
                    return stacked ? y0(d.y0) : y0(0);
                }).attr("height", 0).remove();
                groups.attr("class", function(d, i) {
                    return "nv-group nv-series-" + i;
                }).classed("hover", function(d) {
                    return d.hover;
                }).style("fill", function(d, i) {
                    return color(d, i);
                }).style("stroke", function(d, i) {
                    return color(d, i);
                });
                groups.transition().style("stroke-opacity", 1).style("fill-opacity", .75);
                var bars = groups.selectAll("rect.nv-bar").data(function(d) {
                    return hideable && !data.length ? hideable.values : d.values;
                });
                bars.exit().remove();
                bars.enter().append("rect").attr("class", function(d, i) {
                    return 0 > getY(d, i) ? "nv-bar negative" : "nv-bar positive";
                }).attr("x", function(d, i, j) {
                    return stacked ? 0 : j * x.rangeBand() / data.length;
                }).attr("y", function(d) {
                    return y0(stacked ? d.y0 : 0);
                }).attr("height", 0).attr("width", x.rangeBand() / (stacked ? 1 : data.length)).attr("transform", function(d, i) {
                    return "translate(" + x(getX(d, i)) + ",0)";
                });
                bars.style("fill", function(d, i, j) {
                    return color(d, j, i);
                }).style("stroke", function(d, i, j) {
                    return color(d, j, i);
                }).on("mouseover", function(d, i) {
                    d3.select(this).classed("hover", true);
                    dispatch.elementMouseover({
                        value: getY(d, i),
                        point: d,
                        series: data[d.series],
                        pos: [ x(getX(d, i)) + x.rangeBand() * (stacked ? data.length / 2 : d.series + .5) / data.length, y(getY(d, i) + (stacked ? d.y0 : 0)) ],
                        pointIndex: i,
                        seriesIndex: d.series,
                        e: d3.event
                    });
                }).on("mouseout", function(d, i) {
                    d3.select(this).classed("hover", false);
                    dispatch.elementMouseout({
                        value: getY(d, i),
                        point: d,
                        series: data[d.series],
                        pointIndex: i,
                        seriesIndex: d.series,
                        e: d3.event
                    });
                }).on("click", function(d, i) {
                    dispatch.elementClick({
                        value: getY(d, i),
                        point: d,
                        series: data[d.series],
                        pos: [ x(getX(d, i)) + x.rangeBand() * (stacked ? data.length / 2 : d.series + .5) / data.length, y(getY(d, i) + (stacked ? d.y0 : 0)) ],
                        pointIndex: i,
                        seriesIndex: d.series,
                        e: d3.event
                    });
                    d3.event.stopPropagation();
                }).on("dblclick", function(d, i) {
                    dispatch.elementDblClick({
                        value: getY(d, i),
                        point: d,
                        series: data[d.series],
                        pos: [ x(getX(d, i)) + x.rangeBand() * (stacked ? data.length / 2 : d.series + .5) / data.length, y(getY(d, i) + (stacked ? d.y0 : 0)) ],
                        pointIndex: i,
                        seriesIndex: d.series,
                        e: d3.event
                    });
                    d3.event.stopPropagation();
                });
                bars.attr("class", function(d, i) {
                    return 0 > getY(d, i) ? "nv-bar negative" : "nv-bar positive";
                }).transition().attr("transform", function(d, i) {
                    return "translate(" + x(getX(d, i)) + ",0)";
                });
                if (barColor) {
                    disabled || (disabled = data.map(function() {
                        return true;
                    }));
                    bars.style("fill", function(d, i, j) {
                        return d3.rgb(barColor(d, i)).darker(disabled.map(function(d, i) {
                            return i;
                        }).filter(function(d, i) {
                            return !disabled[i];
                        })[j]).toString();
                    }).style("stroke", function(d, i, j) {
                        return d3.rgb(barColor(d, i)).darker(disabled.map(function(d, i) {
                            return i;
                        }).filter(function(d, i) {
                            return !disabled[i];
                        })[j]).toString();
                    });
                }
                stacked ? bars.transition().delay(function(d, i) {
                    return i * delay / data[0].values.length;
                }).attr("y", function(d) {
                    return y(stacked ? d.y1 : 0);
                }).attr("height", function(d) {
                    return Math.max(Math.abs(y(d.y + (stacked ? d.y0 : 0)) - y(stacked ? d.y0 : 0)), 1);
                }).attr("x", function(d) {
                    return stacked ? 0 : d.series * x.rangeBand() / data.length;
                }).attr("width", x.rangeBand() / (stacked ? 1 : data.length)) : bars.transition().delay(function(d, i) {
                    return i * delay / data[0].values.length;
                }).attr("x", function(d) {
                    return d.series * x.rangeBand() / data.length;
                }).attr("width", x.rangeBand() / data.length).attr("y", function(d, i) {
                    return 0 > getY(d, i) ? y(0) : 1 > y(0) - y(getY(d, i)) ? y(0) - 1 : y(getY(d, i)) || 0;
                }).attr("height", function(d, i) {
                    return Math.max(Math.abs(y(getY(d, i)) - y(0)), 1) || 0;
                });
                x0 = x.copy();
                y0 = y.copy();
            });
            return chart;
        }
        var disabled, xDomain, yDomain, xRange, yRange, margin = {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        }, width = 960, height = 500, x = d3.scale.ordinal(), y = d3.scale.linear(), id = Math.floor(1e4 * Math.random()), getX = function(d) {
            return d.x;
        }, getY = function(d) {
            return d.y;
        }, forceY = [ 0 ], clipEdge = true, stacked = false, stackOffset = "zero", color = nv.utils.defaultColor(), hideable = false, barColor = null, delay = 1200, groupSpacing = .1, dispatch = d3.dispatch("chartClick", "elementClick", "elementDblClick", "elementMouseover", "elementMouseout");
        var x0, y0;
        chart.dispatch = dispatch;
        chart.options = nv.utils.optionsFunc.bind(chart);
        chart.x = function(_) {
            if (!arguments.length) return getX;
            getX = _;
            return chart;
        };
        chart.y = function(_) {
            if (!arguments.length) return getY;
            getY = _;
            return chart;
        };
        chart.margin = function(_) {
            if (!arguments.length) return margin;
            margin.top = "undefined" != typeof _.top ? _.top : margin.top;
            margin.right = "undefined" != typeof _.right ? _.right : margin.right;
            margin.bottom = "undefined" != typeof _.bottom ? _.bottom : margin.bottom;
            margin.left = "undefined" != typeof _.left ? _.left : margin.left;
            return chart;
        };
        chart.width = function(_) {
            if (!arguments.length) return width;
            width = _;
            return chart;
        };
        chart.height = function(_) {
            if (!arguments.length) return height;
            height = _;
            return chart;
        };
        chart.xScale = function(_) {
            if (!arguments.length) return x;
            x = _;
            return chart;
        };
        chart.yScale = function(_) {
            if (!arguments.length) return y;
            y = _;
            return chart;
        };
        chart.xDomain = function(_) {
            if (!arguments.length) return xDomain;
            xDomain = _;
            return chart;
        };
        chart.yDomain = function(_) {
            if (!arguments.length) return yDomain;
            yDomain = _;
            return chart;
        };
        chart.xRange = function(_) {
            if (!arguments.length) return xRange;
            xRange = _;
            return chart;
        };
        chart.yRange = function(_) {
            if (!arguments.length) return yRange;
            yRange = _;
            return chart;
        };
        chart.forceY = function(_) {
            if (!arguments.length) return forceY;
            forceY = _;
            return chart;
        };
        chart.stacked = function(_) {
            if (!arguments.length) return stacked;
            stacked = _;
            return chart;
        };
        chart.stackOffset = function(_) {
            if (!arguments.length) return stackOffset;
            stackOffset = _;
            return chart;
        };
        chart.clipEdge = function(_) {
            if (!arguments.length) return clipEdge;
            clipEdge = _;
            return chart;
        };
        chart.color = function(_) {
            if (!arguments.length) return color;
            color = nv.utils.getColor(_);
            return chart;
        };
        chart.barColor = function(_) {
            if (!arguments.length) return barColor;
            barColor = nv.utils.getColor(_);
            return chart;
        };
        chart.disabled = function(_) {
            if (!arguments.length) return disabled;
            disabled = _;
            return chart;
        };
        chart.id = function(_) {
            if (!arguments.length) return id;
            id = _;
            return chart;
        };
        chart.hideable = function(_) {
            if (!arguments.length) return hideable;
            hideable = _;
            return chart;
        };
        chart.delay = function(_) {
            if (!arguments.length) return delay;
            delay = _;
            return chart;
        };
        chart.groupSpacing = function(_) {
            if (!arguments.length) return groupSpacing;
            groupSpacing = _;
            return chart;
        };
        return chart;
    };
    nv.models.multiBarChart = function() {
        "use strict";
        function chart(selection) {
            selection.each(function(data) {
                var container = d3.select(this), that = this;
                var availableWidth = (width || parseInt(container.style("width")) || 960) - margin.left - margin.right, availableHeight = (height || parseInt(container.style("height")) || 400) - margin.top - margin.bottom;
                chart.update = function() {
                    container.transition().duration(transitionDuration).call(chart);
                };
                chart.container = this;
                state.disabled = data.map(function(d) {
                    return !!d.disabled;
                });
                if (!defaultState) {
                    var key;
                    defaultState = {};
                    for (key in state) defaultState[key] = state[key] instanceof Array ? state[key].slice(0) : state[key];
                }
                if (!(data && data.length && data.filter(function(d) {
                    return d.values.length;
                }).length)) {
                    var noDataText = container.selectAll(".nv-noData").data([ noData ]);
                    noDataText.enter().append("text").attr("class", "nvd3 nv-noData").attr("dy", "-.7em").style("text-anchor", "middle");
                    noDataText.attr("x", margin.left + availableWidth / 2).attr("y", margin.top + availableHeight / 2).text(function(d) {
                        return d;
                    });
                    return chart;
                }
                container.selectAll(".nv-noData").remove();
                x = multibar.xScale();
                y = multibar.yScale();
                var wrap = container.selectAll("g.nv-wrap.nv-multiBarWithLegend").data([ data ]);
                var gEnter = wrap.enter().append("g").attr("class", "nvd3 nv-wrap nv-multiBarWithLegend").append("g");
                var g = wrap.select("g");
                gEnter.append("g").attr("class", "nv-x nv-axis");
                gEnter.append("g").attr("class", "nv-y nv-axis");
                gEnter.append("g").attr("class", "nv-barsWrap");
                gEnter.append("g").attr("class", "nv-legendWrap");
                gEnter.append("g").attr("class", "nv-controlsWrap");
                if (showLegend) {
                    legend.width(availableWidth - controlWidth());
                    multibar.barColor() && data.forEach(function(series, i) {
                        series.color = d3.rgb("#ccc").darker(1.5 * i).toString();
                    });
                    g.select(".nv-legendWrap").datum(data).call(legend);
                    if (margin.top != legend.height()) {
                        margin.top = legend.height();
                        availableHeight = (height || parseInt(container.style("height")) || 400) - margin.top - margin.bottom;
                    }
                    g.select(".nv-legendWrap").attr("transform", "translate(" + controlWidth() + "," + -margin.top + ")");
                }
                if (showControls) {
                    var controlsData = [ {
                        key: "Grouped",
                        disabled: multibar.stacked()
                    }, {
                        key: "Stacked",
                        disabled: !multibar.stacked()
                    } ];
                    controls.width(controlWidth()).color([ "#444", "#444", "#444" ]);
                    g.select(".nv-controlsWrap").datum(controlsData).attr("transform", "translate(0," + -margin.top + ")").call(controls);
                }
                wrap.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                rightAlignYAxis && g.select(".nv-y.nv-axis").attr("transform", "translate(" + availableWidth + ",0)");
                multibar.disabled(data.map(function(series) {
                    return series.disabled;
                })).width(availableWidth).height(availableHeight).color(data.map(function(d, i) {
                    return d.color || color(d, i);
                }).filter(function(d, i) {
                    return !data[i].disabled;
                }));
                var barsWrap = g.select(".nv-barsWrap").datum(data.filter(function(d) {
                    return !d.disabled;
                }));
                barsWrap.transition().call(multibar);
                if (showXAxis) {
                    xAxis.scale(x).ticks(availableWidth / 100).tickSize(-availableHeight, 0);
                    g.select(".nv-x.nv-axis").attr("transform", "translate(0," + y.range()[0] + ")");
                    g.select(".nv-x.nv-axis").transition().call(xAxis);
                    var xTicks = g.select(".nv-x.nv-axis > g").selectAll("g");
                    xTicks.selectAll("line, text").style("opacity", 1);
                    if (staggerLabels) {
                        var getTranslate = function(x, y) {
                            return "translate(" + x + "," + y + ")";
                        };
                        var staggerUp = 5, staggerDown = 17;
                        xTicks.selectAll("text").attr("transform", function(d, i, j) {
                            return getTranslate(0, 0 == j % 2 ? staggerUp : staggerDown);
                        });
                        var totalInBetweenTicks = d3.selectAll(".nv-x.nv-axis .nv-wrap g g text")[0].length;
                        g.selectAll(".nv-x.nv-axis .nv-axisMaxMin text").attr("transform", function(d, i) {
                            return getTranslate(0, 0 === i || 0 !== totalInBetweenTicks % 2 ? staggerDown : staggerUp);
                        });
                    }
                    reduceXTicks && xTicks.filter(function(d, i) {
                        return 0 !== i % Math.ceil(data[0].values.length / (availableWidth / 100));
                    }).selectAll("text, line").style("opacity", 0);
                    rotateLabels && xTicks.selectAll(".tick text").attr("transform", "rotate(" + rotateLabels + " 0,0)").style("text-anchor", rotateLabels > 0 ? "start" : "end");
                    g.select(".nv-x.nv-axis").selectAll("g.nv-axisMaxMin text").style("opacity", 1);
                }
                if (showYAxis) {
                    yAxis.scale(y).ticks(availableHeight / 36).tickSize(-availableWidth, 0);
                    g.select(".nv-y.nv-axis").transition().call(yAxis);
                }
                legend.dispatch.on("stateChange", function(newState) {
                    state = newState;
                    dispatch.stateChange(state);
                    chart.update();
                });
                controls.dispatch.on("legendClick", function(d) {
                    if (!d.disabled) return;
                    controlsData = controlsData.map(function(s) {
                        s.disabled = true;
                        return s;
                    });
                    d.disabled = false;
                    switch (d.key) {
                      case "Grouped":
                        multibar.stacked(false);
                        break;

                      case "Stacked":
                        multibar.stacked(true);
                    }
                    state.stacked = multibar.stacked();
                    dispatch.stateChange(state);
                    chart.update();
                });
                dispatch.on("tooltipShow", function(e) {
                    tooltips && showTooltip(e, that.parentNode);
                });
                dispatch.on("changeState", function(e) {
                    if ("undefined" != typeof e.disabled) {
                        data.forEach(function(series, i) {
                            series.disabled = e.disabled[i];
                        });
                        state.disabled = e.disabled;
                    }
                    if ("undefined" != typeof e.stacked) {
                        multibar.stacked(e.stacked);
                        state.stacked = e.stacked;
                    }
                    chart.update();
                });
            });
            return chart;
        }
        var multibar = nv.models.multiBar(), xAxis = nv.models.axis(), yAxis = nv.models.axis(), legend = nv.models.legend(), controls = nv.models.legend();
        var x, y, margin = {
            top: 30,
            right: 20,
            bottom: 50,
            left: 60
        }, width = null, height = null, color = nv.utils.defaultColor(), showControls = true, showLegend = true, showXAxis = true, showYAxis = true, rightAlignYAxis = false, reduceXTicks = true, staggerLabels = false, rotateLabels = 0, tooltips = true, tooltip = function(key, x, y) {
            return "<h3>" + key + "</h3>" + "<p>" + y + " on " + x + "</p>";
        }, state = {
            stacked: false
        }, defaultState = null, noData = "No Data Available.", dispatch = d3.dispatch("tooltipShow", "tooltipHide", "stateChange", "changeState"), controlWidth = function() {
            return showControls ? 180 : 0;
        }, transitionDuration = 250;
        multibar.stacked(false);
        xAxis.orient("bottom").tickPadding(7).highlightZero(true).showMaxMin(false).tickFormat(function(d) {
            return d;
        });
        yAxis.orient(rightAlignYAxis ? "right" : "left").tickFormat(d3.format(",.1f"));
        controls.updateState(false);
        var showTooltip = function(e, offsetElement) {
            var left = e.pos[0] + (offsetElement.offsetLeft || 0), top = e.pos[1] + (offsetElement.offsetTop || 0), x = xAxis.tickFormat()(multibar.x()(e.point, e.pointIndex)), y = yAxis.tickFormat()(multibar.y()(e.point, e.pointIndex)), content = tooltip(e.series.key, x, y, e, chart);
            nv.tooltip.show([ left, top ], content, 0 > e.value ? "n" : "s", null, offsetElement);
        };
        multibar.dispatch.on("elementMouseover.tooltip", function(e) {
            e.pos = [ e.pos[0] + margin.left, e.pos[1] + margin.top ];
            dispatch.tooltipShow(e);
        });
        multibar.dispatch.on("elementMouseout.tooltip", function(e) {
            dispatch.tooltipHide(e);
        });
        dispatch.on("tooltipHide", function() {
            tooltips && nv.tooltip.cleanup();
        });
        chart.dispatch = dispatch;
        chart.multibar = multibar;
        chart.legend = legend;
        chart.xAxis = xAxis;
        chart.yAxis = yAxis;
        d3.rebind(chart, multibar, "x", "y", "xDomain", "yDomain", "xRange", "yRange", "forceX", "forceY", "clipEdge", "id", "stacked", "stackOffset", "delay", "barColor", "groupSpacing");
        chart.options = nv.utils.optionsFunc.bind(chart);
        chart.margin = function(_) {
            if (!arguments.length) return margin;
            margin.top = "undefined" != typeof _.top ? _.top : margin.top;
            margin.right = "undefined" != typeof _.right ? _.right : margin.right;
            margin.bottom = "undefined" != typeof _.bottom ? _.bottom : margin.bottom;
            margin.left = "undefined" != typeof _.left ? _.left : margin.left;
            return chart;
        };
        chart.width = function(_) {
            if (!arguments.length) return width;
            width = _;
            return chart;
        };
        chart.height = function(_) {
            if (!arguments.length) return height;
            height = _;
            return chart;
        };
        chart.color = function(_) {
            if (!arguments.length) return color;
            color = nv.utils.getColor(_);
            legend.color(color);
            return chart;
        };
        chart.showControls = function(_) {
            if (!arguments.length) return showControls;
            showControls = _;
            return chart;
        };
        chart.showLegend = function(_) {
            if (!arguments.length) return showLegend;
            showLegend = _;
            return chart;
        };
        chart.showXAxis = function(_) {
            if (!arguments.length) return showXAxis;
            showXAxis = _;
            return chart;
        };
        chart.showYAxis = function(_) {
            if (!arguments.length) return showYAxis;
            showYAxis = _;
            return chart;
        };
        chart.rightAlignYAxis = function(_) {
            if (!arguments.length) return rightAlignYAxis;
            rightAlignYAxis = _;
            yAxis.orient(_ ? "right" : "left");
            return chart;
        };
        chart.reduceXTicks = function(_) {
            if (!arguments.length) return reduceXTicks;
            reduceXTicks = _;
            return chart;
        };
        chart.rotateLabels = function(_) {
            if (!arguments.length) return rotateLabels;
            rotateLabels = _;
            return chart;
        };
        chart.staggerLabels = function(_) {
            if (!arguments.length) return staggerLabels;
            staggerLabels = _;
            return chart;
        };
        chart.tooltip = function(_) {
            if (!arguments.length) return tooltip;
            tooltip = _;
            return chart;
        };
        chart.tooltips = function(_) {
            if (!arguments.length) return tooltips;
            tooltips = _;
            return chart;
        };
        chart.tooltipContent = function(_) {
            if (!arguments.length) return tooltip;
            tooltip = _;
            return chart;
        };
        chart.state = function(_) {
            if (!arguments.length) return state;
            state = _;
            return chart;
        };
        chart.defaultState = function(_) {
            if (!arguments.length) return defaultState;
            defaultState = _;
            return chart;
        };
        chart.noData = function(_) {
            if (!arguments.length) return noData;
            noData = _;
            return chart;
        };
        chart.transitionDuration = function(_) {
            if (!arguments.length) return transitionDuration;
            transitionDuration = _;
            return chart;
        };
        return chart;
    };
    nv.models.multiBarHorizontal = function() {
        "use strict";
        function chart(selection) {
            selection.each(function(data) {
                var availableWidth = width - margin.left - margin.right, availableHeight = height - margin.top - margin.bottom;
                d3.select(this);
                stacked && (data = d3.layout.stack().offset("zero").values(function(d) {
                    return d.values;
                }).y(getY)(data));
                data.forEach(function(series, i) {
                    series.values.forEach(function(point) {
                        point.series = i;
                    });
                });
                stacked && data[0].values.map(function(d, i) {
                    var posBase = 0, negBase = 0;
                    data.map(function(d) {
                        var f = d.values[i];
                        f.size = Math.abs(f.y);
                        if (0 > f.y) {
                            f.y1 = negBase - f.size;
                            negBase -= f.size;
                        } else {
                            f.y1 = posBase;
                            posBase += f.size;
                        }
                    });
                });
                var seriesData = xDomain && yDomain ? [] : data.map(function(d) {
                    return d.values.map(function(d, i) {
                        return {
                            x: getX(d, i),
                            y: getY(d, i),
                            y0: d.y0,
                            y1: d.y1
                        };
                    });
                });
                x.domain(xDomain || d3.merge(seriesData).map(function(d) {
                    return d.x;
                })).rangeBands(xRange || [ 0, availableHeight ], .1);
                y.domain(yDomain || d3.extent(d3.merge(seriesData).map(function(d) {
                    return stacked ? d.y > 0 ? d.y1 + d.y : d.y1 : d.y;
                }).concat(forceY)));
                showValues && !stacked ? y.range(yRange || [ 0 > y.domain()[0] ? valuePadding : 0, availableWidth - (y.domain()[1] > 0 ? valuePadding : 0) ]) : y.range(yRange || [ 0, availableWidth ]);
                x0 = x0 || x;
                y0 = y0 || d3.scale.linear().domain(y.domain()).range([ y(0), y(0) ]);
                var wrap = d3.select(this).selectAll("g.nv-wrap.nv-multibarHorizontal").data([ data ]);
                var wrapEnter = wrap.enter().append("g").attr("class", "nvd3 nv-wrap nv-multibarHorizontal");
                wrapEnter.append("defs");
                var gEnter = wrapEnter.append("g");
                wrap.select("g");
                gEnter.append("g").attr("class", "nv-groups");
                wrap.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                var groups = wrap.select(".nv-groups").selectAll(".nv-group").data(function(d) {
                    return d;
                }, function(d, i) {
                    return i;
                });
                groups.enter().append("g").style("stroke-opacity", 1e-6).style("fill-opacity", 1e-6);
                groups.exit().transition().style("stroke-opacity", 1e-6).style("fill-opacity", 1e-6).remove();
                groups.attr("class", function(d, i) {
                    return "nv-group nv-series-" + i;
                }).classed("hover", function(d) {
                    return d.hover;
                }).style("fill", function(d, i) {
                    return color(d, i);
                }).style("stroke", function(d, i) {
                    return color(d, i);
                });
                groups.transition().style("stroke-opacity", 1).style("fill-opacity", .75);
                var bars = groups.selectAll("g.nv-bar").data(function(d) {
                    return d.values;
                });
                bars.exit().remove();
                var barsEnter = bars.enter().append("g").attr("transform", function(d, i, j) {
                    return "translate(" + y0(stacked ? d.y0 : 0) + "," + (stacked ? 0 : j * x.rangeBand() / data.length + x(getX(d, i))) + ")";
                });
                barsEnter.append("rect").attr("width", 0).attr("height", x.rangeBand() / (stacked ? 1 : data.length));
                bars.on("mouseover", function(d, i) {
                    d3.select(this).classed("hover", true);
                    dispatch.elementMouseover({
                        value: getY(d, i),
                        point: d,
                        series: data[d.series],
                        pos: [ y(getY(d, i) + (stacked ? d.y0 : 0)), x(getX(d, i)) + x.rangeBand() * (stacked ? data.length / 2 : d.series + .5) / data.length ],
                        pointIndex: i,
                        seriesIndex: d.series,
                        e: d3.event
                    });
                }).on("mouseout", function(d, i) {
                    d3.select(this).classed("hover", false);
                    dispatch.elementMouseout({
                        value: getY(d, i),
                        point: d,
                        series: data[d.series],
                        pointIndex: i,
                        seriesIndex: d.series,
                        e: d3.event
                    });
                }).on("click", function(d, i) {
                    dispatch.elementClick({
                        value: getY(d, i),
                        point: d,
                        series: data[d.series],
                        pos: [ x(getX(d, i)) + x.rangeBand() * (stacked ? data.length / 2 : d.series + .5) / data.length, y(getY(d, i) + (stacked ? d.y0 : 0)) ],
                        pointIndex: i,
                        seriesIndex: d.series,
                        e: d3.event
                    });
                    d3.event.stopPropagation();
                }).on("dblclick", function(d, i) {
                    dispatch.elementDblClick({
                        value: getY(d, i),
                        point: d,
                        series: data[d.series],
                        pos: [ x(getX(d, i)) + x.rangeBand() * (stacked ? data.length / 2 : d.series + .5) / data.length, y(getY(d, i) + (stacked ? d.y0 : 0)) ],
                        pointIndex: i,
                        seriesIndex: d.series,
                        e: d3.event
                    });
                    d3.event.stopPropagation();
                });
                barsEnter.append("text");
                if (showValues && !stacked) {
                    bars.select("text").attr("text-anchor", function(d, i) {
                        return 0 > getY(d, i) ? "end" : "start";
                    }).attr("y", x.rangeBand() / (2 * data.length)).attr("dy", ".32em").text(function(d, i) {
                        return valueFormat(getY(d, i));
                    });
                    bars.transition().select("text").attr("x", function(d, i) {
                        return 0 > getY(d, i) ? -4 : y(getY(d, i)) - y(0) + 4;
                    });
                } else bars.selectAll("text").text("");
                if (showBarLabels && !stacked) {
                    barsEnter.append("text").classed("nv-bar-label", true);
                    bars.select("text.nv-bar-label").attr("text-anchor", function(d, i) {
                        return 0 > getY(d, i) ? "start" : "end";
                    }).attr("y", x.rangeBand() / (2 * data.length)).attr("dy", ".32em").text(function(d, i) {
                        return getX(d, i);
                    });
                    bars.transition().select("text.nv-bar-label").attr("x", function(d, i) {
                        return 0 > getY(d, i) ? y(0) - y(getY(d, i)) + 4 : -4;
                    });
                } else bars.selectAll("text.nv-bar-label").text("");
                bars.attr("class", function(d, i) {
                    return 0 > getY(d, i) ? "nv-bar negative" : "nv-bar positive";
                });
                if (barColor) {
                    disabled || (disabled = data.map(function() {
                        return true;
                    }));
                    bars.style("fill", function(d, i, j) {
                        return d3.rgb(barColor(d, i)).darker(disabled.map(function(d, i) {
                            return i;
                        }).filter(function(d, i) {
                            return !disabled[i];
                        })[j]).toString();
                    }).style("stroke", function(d, i, j) {
                        return d3.rgb(barColor(d, i)).darker(disabled.map(function(d, i) {
                            return i;
                        }).filter(function(d, i) {
                            return !disabled[i];
                        })[j]).toString();
                    });
                }
                stacked ? bars.transition().attr("transform", function(d, i) {
                    return "translate(" + y(d.y1) + "," + x(getX(d, i)) + ")";
                }).select("rect").attr("width", function(d, i) {
                    return Math.abs(y(getY(d, i) + d.y0) - y(d.y0));
                }).attr("height", x.rangeBand()) : bars.transition().attr("transform", function(d, i) {
                    return "translate(" + (0 > getY(d, i) ? y(getY(d, i)) : y(0)) + "," + (d.series * x.rangeBand() / data.length + x(getX(d, i))) + ")";
                }).select("rect").attr("height", x.rangeBand() / data.length).attr("width", function(d, i) {
                    return Math.max(Math.abs(y(getY(d, i)) - y(0)), 1);
                });
                x0 = x.copy();
                y0 = y.copy();
            });
            return chart;
        }
        var disabled, xDomain, yDomain, xRange, yRange, margin = {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        }, width = 960, height = 500, id = Math.floor(1e4 * Math.random()), x = d3.scale.ordinal(), y = d3.scale.linear(), getX = function(d) {
            return d.x;
        }, getY = function(d) {
            return d.y;
        }, forceY = [ 0 ], color = nv.utils.defaultColor(), barColor = null, stacked = false, showValues = false, showBarLabels = false, valuePadding = 60, valueFormat = d3.format(",.2f"), delay = 1200, dispatch = d3.dispatch("chartClick", "elementClick", "elementDblClick", "elementMouseover", "elementMouseout");
        var x0, y0;
        chart.dispatch = dispatch;
        chart.options = nv.utils.optionsFunc.bind(chart);
        chart.x = function(_) {
            if (!arguments.length) return getX;
            getX = _;
            return chart;
        };
        chart.y = function(_) {
            if (!arguments.length) return getY;
            getY = _;
            return chart;
        };
        chart.margin = function(_) {
            if (!arguments.length) return margin;
            margin.top = "undefined" != typeof _.top ? _.top : margin.top;
            margin.right = "undefined" != typeof _.right ? _.right : margin.right;
            margin.bottom = "undefined" != typeof _.bottom ? _.bottom : margin.bottom;
            margin.left = "undefined" != typeof _.left ? _.left : margin.left;
            return chart;
        };
        chart.width = function(_) {
            if (!arguments.length) return width;
            width = _;
            return chart;
        };
        chart.height = function(_) {
            if (!arguments.length) return height;
            height = _;
            return chart;
        };
        chart.xScale = function(_) {
            if (!arguments.length) return x;
            x = _;
            return chart;
        };
        chart.yScale = function(_) {
            if (!arguments.length) return y;
            y = _;
            return chart;
        };
        chart.xDomain = function(_) {
            if (!arguments.length) return xDomain;
            xDomain = _;
            return chart;
        };
        chart.yDomain = function(_) {
            if (!arguments.length) return yDomain;
            yDomain = _;
            return chart;
        };
        chart.xRange = function(_) {
            if (!arguments.length) return xRange;
            xRange = _;
            return chart;
        };
        chart.yRange = function(_) {
            if (!arguments.length) return yRange;
            yRange = _;
            return chart;
        };
        chart.forceY = function(_) {
            if (!arguments.length) return forceY;
            forceY = _;
            return chart;
        };
        chart.stacked = function(_) {
            if (!arguments.length) return stacked;
            stacked = _;
            return chart;
        };
        chart.color = function(_) {
            if (!arguments.length) return color;
            color = nv.utils.getColor(_);
            return chart;
        };
        chart.barColor = function(_) {
            if (!arguments.length) return barColor;
            barColor = nv.utils.getColor(_);
            return chart;
        };
        chart.disabled = function(_) {
            if (!arguments.length) return disabled;
            disabled = _;
            return chart;
        };
        chart.id = function(_) {
            if (!arguments.length) return id;
            id = _;
            return chart;
        };
        chart.delay = function(_) {
            if (!arguments.length) return delay;
            delay = _;
            return chart;
        };
        chart.showValues = function(_) {
            if (!arguments.length) return showValues;
            showValues = _;
            return chart;
        };
        chart.showBarLabels = function(_) {
            if (!arguments.length) return showBarLabels;
            showBarLabels = _;
            return chart;
        };
        chart.valueFormat = function(_) {
            if (!arguments.length) return valueFormat;
            valueFormat = _;
            return chart;
        };
        chart.valuePadding = function(_) {
            if (!arguments.length) return valuePadding;
            valuePadding = _;
            return chart;
        };
        return chart;
    };
    nv.models.multiBarHorizontalChart = function() {
        "use strict";
        function chart(selection) {
            selection.each(function(data) {
                var container = d3.select(this), that = this;
                var availableWidth = (width || parseInt(container.style("width")) || 960) - margin.left - margin.right, availableHeight = (height || parseInt(container.style("height")) || 400) - margin.top - margin.bottom;
                chart.update = function() {
                    container.transition().duration(transitionDuration).call(chart);
                };
                chart.container = this;
                state.disabled = data.map(function(d) {
                    return !!d.disabled;
                });
                if (!defaultState) {
                    var key;
                    defaultState = {};
                    for (key in state) defaultState[key] = state[key] instanceof Array ? state[key].slice(0) : state[key];
                }
                if (!(data && data.length && data.filter(function(d) {
                    return d.values.length;
                }).length)) {
                    var noDataText = container.selectAll(".nv-noData").data([ noData ]);
                    noDataText.enter().append("text").attr("class", "nvd3 nv-noData").attr("dy", "-.7em").style("text-anchor", "middle");
                    noDataText.attr("x", margin.left + availableWidth / 2).attr("y", margin.top + availableHeight / 2).text(function(d) {
                        return d;
                    });
                    return chart;
                }
                container.selectAll(".nv-noData").remove();
                x = multibar.xScale();
                y = multibar.yScale();
                var wrap = container.selectAll("g.nv-wrap.nv-multiBarHorizontalChart").data([ data ]);
                var gEnter = wrap.enter().append("g").attr("class", "nvd3 nv-wrap nv-multiBarHorizontalChart").append("g");
                var g = wrap.select("g");
                gEnter.append("g").attr("class", "nv-x nv-axis");
                gEnter.append("g").attr("class", "nv-y nv-axis").append("g").attr("class", "nv-zeroLine").append("line");
                gEnter.append("g").attr("class", "nv-barsWrap");
                gEnter.append("g").attr("class", "nv-legendWrap");
                gEnter.append("g").attr("class", "nv-controlsWrap");
                if (showLegend) {
                    legend.width(availableWidth - controlWidth());
                    multibar.barColor() && data.forEach(function(series, i) {
                        series.color = d3.rgb("#ccc").darker(1.5 * i).toString();
                    });
                    g.select(".nv-legendWrap").datum(data).call(legend);
                    if (margin.top != legend.height()) {
                        margin.top = legend.height();
                        availableHeight = (height || parseInt(container.style("height")) || 400) - margin.top - margin.bottom;
                    }
                    g.select(".nv-legendWrap").attr("transform", "translate(" + controlWidth() + "," + -margin.top + ")");
                }
                if (showControls) {
                    var controlsData = [ {
                        key: "Grouped",
                        disabled: multibar.stacked()
                    }, {
                        key: "Stacked",
                        disabled: !multibar.stacked()
                    } ];
                    controls.width(controlWidth()).color([ "#444", "#444", "#444" ]);
                    g.select(".nv-controlsWrap").datum(controlsData).attr("transform", "translate(0," + -margin.top + ")").call(controls);
                }
                wrap.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                multibar.disabled(data.map(function(series) {
                    return series.disabled;
                })).width(availableWidth).height(availableHeight).color(data.map(function(d, i) {
                    return d.color || color(d, i);
                }).filter(function(d, i) {
                    return !data[i].disabled;
                }));
                var barsWrap = g.select(".nv-barsWrap").datum(data.filter(function(d) {
                    return !d.disabled;
                }));
                barsWrap.transition().call(multibar);
                if (showXAxis) {
                    xAxis.scale(x).ticks(availableHeight / 24).tickSize(-availableWidth, 0);
                    g.select(".nv-x.nv-axis").transition().call(xAxis);
                    var xTicks = g.select(".nv-x.nv-axis").selectAll("g");
                    xTicks.selectAll("line, text");
                }
                if (showYAxis) {
                    yAxis.scale(y).ticks(availableWidth / 100).tickSize(-availableHeight, 0);
                    g.select(".nv-y.nv-axis").attr("transform", "translate(0," + availableHeight + ")");
                    g.select(".nv-y.nv-axis").transition().call(yAxis);
                }
                g.select(".nv-zeroLine line").attr("x1", y(0)).attr("x2", y(0)).attr("y1", 0).attr("y2", -availableHeight);
                legend.dispatch.on("stateChange", function(newState) {
                    state = newState;
                    dispatch.stateChange(state);
                    chart.update();
                });
                controls.dispatch.on("legendClick", function(d) {
                    if (!d.disabled) return;
                    controlsData = controlsData.map(function(s) {
                        s.disabled = true;
                        return s;
                    });
                    d.disabled = false;
                    switch (d.key) {
                      case "Grouped":
                        multibar.stacked(false);
                        break;

                      case "Stacked":
                        multibar.stacked(true);
                    }
                    state.stacked = multibar.stacked();
                    dispatch.stateChange(state);
                    chart.update();
                });
                dispatch.on("tooltipShow", function(e) {
                    tooltips && showTooltip(e, that.parentNode);
                });
                dispatch.on("changeState", function(e) {
                    if ("undefined" != typeof e.disabled) {
                        data.forEach(function(series, i) {
                            series.disabled = e.disabled[i];
                        });
                        state.disabled = e.disabled;
                    }
                    if ("undefined" != typeof e.stacked) {
                        multibar.stacked(e.stacked);
                        state.stacked = e.stacked;
                    }
                    chart.update();
                });
            });
            return chart;
        }
        var multibar = nv.models.multiBarHorizontal(), xAxis = nv.models.axis(), yAxis = nv.models.axis(), legend = nv.models.legend().height(30), controls = nv.models.legend().height(30);
        var x, y, margin = {
            top: 30,
            right: 20,
            bottom: 50,
            left: 60
        }, width = null, height = null, color = nv.utils.defaultColor(), showControls = true, showLegend = true, showXAxis = true, showYAxis = true, stacked = false, tooltips = true, tooltip = function(key, x, y) {
            return "<h3>" + key + " - " + x + "</h3>" + "<p>" + y + "</p>";
        }, state = {
            stacked: stacked
        }, defaultState = null, noData = "No Data Available.", dispatch = d3.dispatch("tooltipShow", "tooltipHide", "stateChange", "changeState"), controlWidth = function() {
            return showControls ? 180 : 0;
        }, transitionDuration = 250;
        multibar.stacked(stacked);
        xAxis.orient("left").tickPadding(5).highlightZero(false).showMaxMin(false).tickFormat(function(d) {
            return d;
        });
        yAxis.orient("bottom").tickFormat(d3.format(",.1f"));
        controls.updateState(false);
        var showTooltip = function(e, offsetElement) {
            var left = e.pos[0] + (offsetElement.offsetLeft || 0), top = e.pos[1] + (offsetElement.offsetTop || 0), x = xAxis.tickFormat()(multibar.x()(e.point, e.pointIndex)), y = yAxis.tickFormat()(multibar.y()(e.point, e.pointIndex)), content = tooltip(e.series.key, x, y, e, chart);
            nv.tooltip.show([ left, top ], content, 0 > e.value ? "e" : "w", null, offsetElement);
        };
        multibar.dispatch.on("elementMouseover.tooltip", function(e) {
            e.pos = [ e.pos[0] + margin.left, e.pos[1] + margin.top ];
            dispatch.tooltipShow(e);
        });
        multibar.dispatch.on("elementMouseout.tooltip", function(e) {
            dispatch.tooltipHide(e);
        });
        dispatch.on("tooltipHide", function() {
            tooltips && nv.tooltip.cleanup();
        });
        chart.dispatch = dispatch;
        chart.multibar = multibar;
        chart.legend = legend;
        chart.xAxis = xAxis;
        chart.yAxis = yAxis;
        d3.rebind(chart, multibar, "x", "y", "xDomain", "yDomain", "xRange", "yRange", "forceX", "forceY", "clipEdge", "id", "delay", "showValues", "showBarLabels", "valueFormat", "stacked", "barColor");
        chart.options = nv.utils.optionsFunc.bind(chart);
        chart.margin = function(_) {
            if (!arguments.length) return margin;
            margin.top = "undefined" != typeof _.top ? _.top : margin.top;
            margin.right = "undefined" != typeof _.right ? _.right : margin.right;
            margin.bottom = "undefined" != typeof _.bottom ? _.bottom : margin.bottom;
            margin.left = "undefined" != typeof _.left ? _.left : margin.left;
            return chart;
        };
        chart.width = function(_) {
            if (!arguments.length) return width;
            width = _;
            return chart;
        };
        chart.height = function(_) {
            if (!arguments.length) return height;
            height = _;
            return chart;
        };
        chart.color = function(_) {
            if (!arguments.length) return color;
            color = nv.utils.getColor(_);
            legend.color(color);
            return chart;
        };
        chart.showControls = function(_) {
            if (!arguments.length) return showControls;
            showControls = _;
            return chart;
        };
        chart.showLegend = function(_) {
            if (!arguments.length) return showLegend;
            showLegend = _;
            return chart;
        };
        chart.showXAxis = function(_) {
            if (!arguments.length) return showXAxis;
            showXAxis = _;
            return chart;
        };
        chart.showYAxis = function(_) {
            if (!arguments.length) return showYAxis;
            showYAxis = _;
            return chart;
        };
        chart.tooltip = function(_) {
            if (!arguments.length) return tooltip;
            tooltip = _;
            return chart;
        };
        chart.tooltips = function(_) {
            if (!arguments.length) return tooltips;
            tooltips = _;
            return chart;
        };
        chart.tooltipContent = function(_) {
            if (!arguments.length) return tooltip;
            tooltip = _;
            return chart;
        };
        chart.state = function(_) {
            if (!arguments.length) return state;
            state = _;
            return chart;
        };
        chart.defaultState = function(_) {
            if (!arguments.length) return defaultState;
            defaultState = _;
            return chart;
        };
        chart.noData = function(_) {
            if (!arguments.length) return noData;
            noData = _;
            return chart;
        };
        chart.transitionDuration = function(_) {
            if (!arguments.length) return transitionDuration;
            transitionDuration = _;
            return chart;
        };
        return chart;
    };
    nv.models.multiChart = function() {
        "use strict";
        function chart(selection) {
            selection.each(function(data) {
                var container = d3.select(this), that = this;
                chart.update = function() {
                    container.transition().call(chart);
                };
                chart.container = this;
                var availableWidth = (width || parseInt(container.style("width")) || 960) - margin.left - margin.right, availableHeight = (height || parseInt(container.style("height")) || 400) - margin.top - margin.bottom;
                var dataLines1 = data.filter(function(d) {
                    return !d.disabled && "line" == d.type && 1 == d.yAxis;
                });
                var dataLines2 = data.filter(function(d) {
                    return !d.disabled && "line" == d.type && 2 == d.yAxis;
                });
                var dataBars1 = data.filter(function(d) {
                    return !d.disabled && "bar" == d.type && 1 == d.yAxis;
                });
                var dataBars2 = data.filter(function(d) {
                    return !d.disabled && "bar" == d.type && 2 == d.yAxis;
                });
                var dataStack1 = data.filter(function(d) {
                    return !d.disabled && "area" == d.type && 1 == d.yAxis;
                });
                var dataStack2 = data.filter(function(d) {
                    return !d.disabled && "area" == d.type && 2 == d.yAxis;
                });
                var series1 = data.filter(function(d) {
                    return !d.disabled && 1 == d.yAxis;
                }).map(function(d) {
                    return d.values.map(function(d) {
                        return {
                            x: d.x,
                            y: d.y
                        };
                    });
                });
                var series2 = data.filter(function(d) {
                    return !d.disabled && 2 == d.yAxis;
                }).map(function(d) {
                    return d.values.map(function(d) {
                        return {
                            x: d.x,
                            y: d.y
                        };
                    });
                });
                x.domain(d3.extent(d3.merge(series1.concat(series2)), function(d) {
                    return d.x;
                })).range([ 0, availableWidth ]);
                var wrap = container.selectAll("g.wrap.multiChart").data([ data ]);
                var gEnter = wrap.enter().append("g").attr("class", "wrap nvd3 multiChart").append("g");
                gEnter.append("g").attr("class", "x axis");
                gEnter.append("g").attr("class", "y1 axis");
                gEnter.append("g").attr("class", "y2 axis");
                gEnter.append("g").attr("class", "lines1Wrap");
                gEnter.append("g").attr("class", "lines2Wrap");
                gEnter.append("g").attr("class", "bars1Wrap");
                gEnter.append("g").attr("class", "bars2Wrap");
                gEnter.append("g").attr("class", "stack1Wrap");
                gEnter.append("g").attr("class", "stack2Wrap");
                gEnter.append("g").attr("class", "legendWrap");
                var g = wrap.select("g");
                if (showLegend) {
                    legend.width(availableWidth / 2);
                    g.select(".legendWrap").datum(data.map(function(series) {
                        series.originalKey = void 0 === series.originalKey ? series.key : series.originalKey;
                        series.key = series.originalKey + (1 == series.yAxis ? "" : " (right axis)");
                        return series;
                    })).call(legend);
                    if (margin.top != legend.height()) {
                        margin.top = legend.height();
                        availableHeight = (height || parseInt(container.style("height")) || 400) - margin.top - margin.bottom;
                    }
                    g.select(".legendWrap").attr("transform", "translate(" + availableWidth / 2 + "," + -margin.top + ")");
                }
                lines1.width(availableWidth).height(availableHeight).interpolate("monotone").color(data.map(function(d, i) {
                    return d.color || color[i % color.length];
                }).filter(function(d, i) {
                    return !data[i].disabled && 1 == data[i].yAxis && "line" == data[i].type;
                }));
                lines2.width(availableWidth).height(availableHeight).interpolate("monotone").color(data.map(function(d, i) {
                    return d.color || color[i % color.length];
                }).filter(function(d, i) {
                    return !data[i].disabled && 2 == data[i].yAxis && "line" == data[i].type;
                }));
                bars1.width(availableWidth).height(availableHeight).color(data.map(function(d, i) {
                    return d.color || color[i % color.length];
                }).filter(function(d, i) {
                    return !data[i].disabled && 1 == data[i].yAxis && "bar" == data[i].type;
                }));
                bars2.width(availableWidth).height(availableHeight).color(data.map(function(d, i) {
                    return d.color || color[i % color.length];
                }).filter(function(d, i) {
                    return !data[i].disabled && 2 == data[i].yAxis && "bar" == data[i].type;
                }));
                stack1.width(availableWidth).height(availableHeight).color(data.map(function(d, i) {
                    return d.color || color[i % color.length];
                }).filter(function(d, i) {
                    return !data[i].disabled && 1 == data[i].yAxis && "area" == data[i].type;
                }));
                stack2.width(availableWidth).height(availableHeight).color(data.map(function(d, i) {
                    return d.color || color[i % color.length];
                }).filter(function(d, i) {
                    return !data[i].disabled && 2 == data[i].yAxis && "area" == data[i].type;
                }));
                g.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                var lines1Wrap = g.select(".lines1Wrap").datum(dataLines1);
                var bars1Wrap = g.select(".bars1Wrap").datum(dataBars1);
                var stack1Wrap = g.select(".stack1Wrap").datum(dataStack1);
                var lines2Wrap = g.select(".lines2Wrap").datum(dataLines2);
                var bars2Wrap = g.select(".bars2Wrap").datum(dataBars2);
                var stack2Wrap = g.select(".stack2Wrap").datum(dataStack2);
                var extraValue1 = dataStack1.length ? dataStack1.map(function(a) {
                    return a.values;
                }).reduce(function(a, b) {
                    return a.map(function(aVal, i) {
                        return {
                            x: aVal.x,
                            y: aVal.y + b[i].y
                        };
                    });
                }).concat([ {
                    x: 0,
                    y: 0
                } ]) : [];
                var extraValue2 = dataStack2.length ? dataStack2.map(function(a) {
                    return a.values;
                }).reduce(function(a, b) {
                    return a.map(function(aVal, i) {
                        return {
                            x: aVal.x,
                            y: aVal.y + b[i].y
                        };
                    });
                }).concat([ {
                    x: 0,
                    y: 0
                } ]) : [];
                yScale1.domain(yDomain1 || d3.extent(d3.merge(series1).concat(extraValue1), function(d) {
                    return d.y;
                })).range([ 0, availableHeight ]);
                yScale2.domain(yDomain2 || d3.extent(d3.merge(series2).concat(extraValue2), function(d) {
                    return d.y;
                })).range([ 0, availableHeight ]);
                lines1.yDomain(yScale1.domain());
                bars1.yDomain(yScale1.domain());
                stack1.yDomain(yScale1.domain());
                lines2.yDomain(yScale2.domain());
                bars2.yDomain(yScale2.domain());
                stack2.yDomain(yScale2.domain());
                dataStack1.length && d3.transition(stack1Wrap).call(stack1);
                dataStack2.length && d3.transition(stack2Wrap).call(stack2);
                dataBars1.length && d3.transition(bars1Wrap).call(bars1);
                dataBars2.length && d3.transition(bars2Wrap).call(bars2);
                dataLines1.length && d3.transition(lines1Wrap).call(lines1);
                dataLines2.length && d3.transition(lines2Wrap).call(lines2);
                xAxis.ticks(availableWidth / 100).tickSize(-availableHeight, 0);
                g.select(".x.axis").attr("transform", "translate(0," + availableHeight + ")");
                d3.transition(g.select(".x.axis")).call(xAxis);
                yAxis1.ticks(availableHeight / 36).tickSize(-availableWidth, 0);
                d3.transition(g.select(".y1.axis")).call(yAxis1);
                yAxis2.ticks(availableHeight / 36).tickSize(-availableWidth, 0);
                d3.transition(g.select(".y2.axis")).call(yAxis2);
                g.select(".y2.axis").style("opacity", series2.length ? 1 : 0).attr("transform", "translate(" + x.range()[1] + ",0)");
                legend.dispatch.on("stateChange", function() {
                    chart.update();
                });
                dispatch.on("tooltipShow", function(e) {
                    tooltips && showTooltip(e, that.parentNode);
                });
            });
            return chart;
        }
        var x, yDomain1, yDomain2, margin = {
            top: 30,
            right: 20,
            bottom: 50,
            left: 60
        }, color = d3.scale.category20().range(), width = null, height = null, showLegend = true, tooltips = true, tooltip = function(key, x, y) {
            return "<h3>" + key + "</h3>" + "<p>" + y + " at " + x + "</p>";
        };
        var x = d3.scale.linear(), yScale1 = d3.scale.linear(), yScale2 = d3.scale.linear(), lines1 = nv.models.line().yScale(yScale1), lines2 = nv.models.line().yScale(yScale2), bars1 = nv.models.multiBar().stacked(false).yScale(yScale1), bars2 = nv.models.multiBar().stacked(false).yScale(yScale2), stack1 = nv.models.stackedArea().yScale(yScale1), stack2 = nv.models.stackedArea().yScale(yScale2), xAxis = nv.models.axis().scale(x).orient("bottom").tickPadding(5), yAxis1 = nv.models.axis().scale(yScale1).orient("left"), yAxis2 = nv.models.axis().scale(yScale2).orient("right"), legend = nv.models.legend().height(30), dispatch = d3.dispatch("tooltipShow", "tooltipHide");
        var showTooltip = function(e, offsetElement) {
            var left = e.pos[0] + (offsetElement.offsetLeft || 0), top = e.pos[1] + (offsetElement.offsetTop || 0), x = xAxis.tickFormat()(lines1.x()(e.point, e.pointIndex)), y = (2 == e.series.yAxis ? yAxis2 : yAxis1).tickFormat()(lines1.y()(e.point, e.pointIndex)), content = tooltip(e.series.key, x, y, e, chart);
            nv.tooltip.show([ left, top ], content, void 0, void 0, offsetElement.offsetParent);
        };
        lines1.dispatch.on("elementMouseover.tooltip", function(e) {
            e.pos = [ e.pos[0] + margin.left, e.pos[1] + margin.top ];
            dispatch.tooltipShow(e);
        });
        lines1.dispatch.on("elementMouseout.tooltip", function(e) {
            dispatch.tooltipHide(e);
        });
        lines2.dispatch.on("elementMouseover.tooltip", function(e) {
            e.pos = [ e.pos[0] + margin.left, e.pos[1] + margin.top ];
            dispatch.tooltipShow(e);
        });
        lines2.dispatch.on("elementMouseout.tooltip", function(e) {
            dispatch.tooltipHide(e);
        });
        bars1.dispatch.on("elementMouseover.tooltip", function(e) {
            e.pos = [ e.pos[0] + margin.left, e.pos[1] + margin.top ];
            dispatch.tooltipShow(e);
        });
        bars1.dispatch.on("elementMouseout.tooltip", function(e) {
            dispatch.tooltipHide(e);
        });
        bars2.dispatch.on("elementMouseover.tooltip", function(e) {
            e.pos = [ e.pos[0] + margin.left, e.pos[1] + margin.top ];
            dispatch.tooltipShow(e);
        });
        bars2.dispatch.on("elementMouseout.tooltip", function(e) {
            dispatch.tooltipHide(e);
        });
        stack1.dispatch.on("tooltipShow", function(e) {
            if (!Math.round(100 * stack1.y()(e.point))) {
                setTimeout(function() {
                    d3.selectAll(".point.hover").classed("hover", false);
                }, 0);
                return false;
            }
            e.pos = [ e.pos[0] + margin.left, e.pos[1] + margin.top ], dispatch.tooltipShow(e);
        });
        stack1.dispatch.on("tooltipHide", function(e) {
            dispatch.tooltipHide(e);
        });
        stack2.dispatch.on("tooltipShow", function(e) {
            if (!Math.round(100 * stack2.y()(e.point))) {
                setTimeout(function() {
                    d3.selectAll(".point.hover").classed("hover", false);
                }, 0);
                return false;
            }
            e.pos = [ e.pos[0] + margin.left, e.pos[1] + margin.top ], dispatch.tooltipShow(e);
        });
        stack2.dispatch.on("tooltipHide", function(e) {
            dispatch.tooltipHide(e);
        });
        lines1.dispatch.on("elementMouseover.tooltip", function(e) {
            e.pos = [ e.pos[0] + margin.left, e.pos[1] + margin.top ];
            dispatch.tooltipShow(e);
        });
        lines1.dispatch.on("elementMouseout.tooltip", function(e) {
            dispatch.tooltipHide(e);
        });
        lines2.dispatch.on("elementMouseover.tooltip", function(e) {
            e.pos = [ e.pos[0] + margin.left, e.pos[1] + margin.top ];
            dispatch.tooltipShow(e);
        });
        lines2.dispatch.on("elementMouseout.tooltip", function(e) {
            dispatch.tooltipHide(e);
        });
        dispatch.on("tooltipHide", function() {
            tooltips && nv.tooltip.cleanup();
        });
        chart.dispatch = dispatch;
        chart.lines1 = lines1;
        chart.lines2 = lines2;
        chart.bars1 = bars1;
        chart.bars2 = bars2;
        chart.stack1 = stack1;
        chart.stack2 = stack2;
        chart.xAxis = xAxis;
        chart.yAxis1 = yAxis1;
        chart.yAxis2 = yAxis2;
        chart.options = nv.utils.optionsFunc.bind(chart);
        chart.x = function(_) {
            if (!arguments.length) return getX;
            getX = _;
            lines1.x(_);
            bars1.x(_);
            return chart;
        };
        chart.y = function(_) {
            if (!arguments.length) return getY;
            getY = _;
            lines1.y(_);
            bars1.y(_);
            return chart;
        };
        chart.yDomain1 = function(_) {
            if (!arguments.length) return yDomain1;
            yDomain1 = _;
            return chart;
        };
        chart.yDomain2 = function(_) {
            if (!arguments.length) return yDomain2;
            yDomain2 = _;
            return chart;
        };
        chart.margin = function(_) {
            if (!arguments.length) return margin;
            margin = _;
            return chart;
        };
        chart.width = function(_) {
            if (!arguments.length) return width;
            width = _;
            return chart;
        };
        chart.height = function(_) {
            if (!arguments.length) return height;
            height = _;
            return chart;
        };
        chart.color = function(_) {
            if (!arguments.length) return color;
            color = _;
            legend.color(_);
            return chart;
        };
        chart.showLegend = function(_) {
            if (!arguments.length) return showLegend;
            showLegend = _;
            return chart;
        };
        chart.tooltips = function(_) {
            if (!arguments.length) return tooltips;
            tooltips = _;
            return chart;
        };
        chart.tooltipContent = function(_) {
            if (!arguments.length) return tooltip;
            tooltip = _;
            return chart;
        };
        return chart;
    };
    nv.models.ohlcBar = function() {
        "use strict";
        function chart(selection) {
            selection.each(function(data) {
                var availableWidth = width - margin.left - margin.right, availableHeight = height - margin.top - margin.bottom, container = d3.select(this);
                x.domain(xDomain || d3.extent(data[0].values.map(getX).concat(forceX)));
                padData ? x.range(xRange || [ .5 * availableWidth / data[0].values.length, availableWidth * (data[0].values.length - .5) / data[0].values.length ]) : x.range(xRange || [ 0, availableWidth ]);
                y.domain(yDomain || [ d3.min(data[0].values.map(getLow).concat(forceY)), d3.max(data[0].values.map(getHigh).concat(forceY)) ]).range(yRange || [ availableHeight, 0 ]);
                x.domain()[0] === x.domain()[1] && (x.domain()[0] ? x.domain([ x.domain()[0] - .01 * x.domain()[0], x.domain()[1] + .01 * x.domain()[1] ]) : x.domain([ -1, 1 ]));
                y.domain()[0] === y.domain()[1] && (y.domain()[0] ? y.domain([ y.domain()[0] + .01 * y.domain()[0], y.domain()[1] - .01 * y.domain()[1] ]) : y.domain([ -1, 1 ]));
                var wrap = d3.select(this).selectAll("g.nv-wrap.nv-ohlcBar").data([ data[0].values ]);
                var wrapEnter = wrap.enter().append("g").attr("class", "nvd3 nv-wrap nv-ohlcBar");
                var defsEnter = wrapEnter.append("defs");
                var gEnter = wrapEnter.append("g");
                var g = wrap.select("g");
                gEnter.append("g").attr("class", "nv-ticks");
                wrap.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                container.on("click", function(d, i) {
                    dispatch.chartClick({
                        data: d,
                        index: i,
                        pos: d3.event,
                        id: id
                    });
                });
                defsEnter.append("clipPath").attr("id", "nv-chart-clip-path-" + id).append("rect");
                wrap.select("#nv-chart-clip-path-" + id + " rect").attr("width", availableWidth).attr("height", availableHeight);
                g.attr("clip-path", clipEdge ? "url(#nv-chart-clip-path-" + id + ")" : "");
                var ticks = wrap.select(".nv-ticks").selectAll(".nv-tick").data(function(d) {
                    return d;
                });
                ticks.exit().remove();
                ticks.enter().append("path").attr("class", function(d, i, j) {
                    return (getOpen(d, i) > getClose(d, i) ? "nv-tick negative" : "nv-tick positive") + " nv-tick-" + j + "-" + i;
                }).attr("d", function(d, i) {
                    var w = .9 * (availableWidth / data[0].values.length);
                    return "m0,0l0," + (y(getOpen(d, i)) - y(getHigh(d, i))) + "l" + -w / 2 + ",0l" + w / 2 + ",0l0," + (y(getLow(d, i)) - y(getOpen(d, i))) + "l0," + (y(getClose(d, i)) - y(getLow(d, i))) + "l" + w / 2 + ",0l" + -w / 2 + ",0z";
                }).attr("transform", function(d, i) {
                    return "translate(" + x(getX(d, i)) + "," + y(getHigh(d, i)) + ")";
                }).on("mouseover", function(d, i) {
                    d3.select(this).classed("hover", true);
                    dispatch.elementMouseover({
                        point: d,
                        series: data[0],
                        pos: [ x(getX(d, i)), y(getY(d, i)) ],
                        pointIndex: i,
                        seriesIndex: 0,
                        e: d3.event
                    });
                }).on("mouseout", function(d, i) {
                    d3.select(this).classed("hover", false);
                    dispatch.elementMouseout({
                        point: d,
                        series: data[0],
                        pointIndex: i,
                        seriesIndex: 0,
                        e: d3.event
                    });
                }).on("click", function(d, i) {
                    dispatch.elementClick({
                        value: getY(d, i),
                        data: d,
                        index: i,
                        pos: [ x(getX(d, i)), y(getY(d, i)) ],
                        e: d3.event,
                        id: id
                    });
                    d3.event.stopPropagation();
                }).on("dblclick", function(d, i) {
                    dispatch.elementDblClick({
                        value: getY(d, i),
                        data: d,
                        index: i,
                        pos: [ x(getX(d, i)), y(getY(d, i)) ],
                        e: d3.event,
                        id: id
                    });
                    d3.event.stopPropagation();
                });
                ticks.attr("class", function(d, i, j) {
                    return (getOpen(d, i) > getClose(d, i) ? "nv-tick negative" : "nv-tick positive") + " nv-tick-" + j + "-" + i;
                });
                d3.transition(ticks).attr("transform", function(d, i) {
                    return "translate(" + x(getX(d, i)) + "," + y(getHigh(d, i)) + ")";
                }).attr("d", function(d, i) {
                    var w = .9 * (availableWidth / data[0].values.length);
                    return "m0,0l0," + (y(getOpen(d, i)) - y(getHigh(d, i))) + "l" + -w / 2 + ",0l" + w / 2 + ",0l0," + (y(getLow(d, i)) - y(getOpen(d, i))) + "l0," + (y(getClose(d, i)) - y(getLow(d, i))) + "l" + w / 2 + ",0l" + -w / 2 + ",0z";
                });
            });
            return chart;
        }
        var xDomain, yDomain, xRange, yRange, margin = {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        }, width = 960, height = 500, id = Math.floor(1e4 * Math.random()), x = d3.scale.linear(), y = d3.scale.linear(), getX = function(d) {
            return d.x;
        }, getY = function(d) {
            return d.y;
        }, getOpen = function(d) {
            return d.open;
        }, getClose = function(d) {
            return d.close;
        }, getHigh = function(d) {
            return d.high;
        }, getLow = function(d) {
            return d.low;
        }, forceX = [], forceY = [], padData = false, clipEdge = true, color = nv.utils.defaultColor(), dispatch = d3.dispatch("chartClick", "elementClick", "elementDblClick", "elementMouseover", "elementMouseout");
        chart.dispatch = dispatch;
        chart.options = nv.utils.optionsFunc.bind(chart);
        chart.x = function(_) {
            if (!arguments.length) return getX;
            getX = _;
            return chart;
        };
        chart.y = function(_) {
            if (!arguments.length) return getY;
            getY = _;
            return chart;
        };
        chart.open = function(_) {
            if (!arguments.length) return getOpen;
            getOpen = _;
            return chart;
        };
        chart.close = function(_) {
            if (!arguments.length) return getClose;
            getClose = _;
            return chart;
        };
        chart.high = function(_) {
            if (!arguments.length) return getHigh;
            getHigh = _;
            return chart;
        };
        chart.low = function(_) {
            if (!arguments.length) return getLow;
            getLow = _;
            return chart;
        };
        chart.margin = function(_) {
            if (!arguments.length) return margin;
            margin.top = "undefined" != typeof _.top ? _.top : margin.top;
            margin.right = "undefined" != typeof _.right ? _.right : margin.right;
            margin.bottom = "undefined" != typeof _.bottom ? _.bottom : margin.bottom;
            margin.left = "undefined" != typeof _.left ? _.left : margin.left;
            return chart;
        };
        chart.width = function(_) {
            if (!arguments.length) return width;
            width = _;
            return chart;
        };
        chart.height = function(_) {
            if (!arguments.length) return height;
            height = _;
            return chart;
        };
        chart.xScale = function(_) {
            if (!arguments.length) return x;
            x = _;
            return chart;
        };
        chart.yScale = function(_) {
            if (!arguments.length) return y;
            y = _;
            return chart;
        };
        chart.xDomain = function(_) {
            if (!arguments.length) return xDomain;
            xDomain = _;
            return chart;
        };
        chart.yDomain = function(_) {
            if (!arguments.length) return yDomain;
            yDomain = _;
            return chart;
        };
        chart.xRange = function(_) {
            if (!arguments.length) return xRange;
            xRange = _;
            return chart;
        };
        chart.yRange = function(_) {
            if (!arguments.length) return yRange;
            yRange = _;
            return chart;
        };
        chart.forceX = function(_) {
            if (!arguments.length) return forceX;
            forceX = _;
            return chart;
        };
        chart.forceY = function(_) {
            if (!arguments.length) return forceY;
            forceY = _;
            return chart;
        };
        chart.padData = function(_) {
            if (!arguments.length) return padData;
            padData = _;
            return chart;
        };
        chart.clipEdge = function(_) {
            if (!arguments.length) return clipEdge;
            clipEdge = _;
            return chart;
        };
        chart.color = function(_) {
            if (!arguments.length) return color;
            color = nv.utils.getColor(_);
            return chart;
        };
        chart.id = function(_) {
            if (!arguments.length) return id;
            id = _;
            return chart;
        };
        return chart;
    };
    nv.models.pie = function() {
        "use strict";
        function chart(selection) {
            selection.each(function(data) {
                function arcTween(a) {
                    a.endAngle = isNaN(a.endAngle) ? 0 : a.endAngle;
                    a.startAngle = isNaN(a.startAngle) ? 0 : a.startAngle;
                    donut || (a.innerRadius = 0);
                    var i = d3.interpolate(this._current, a);
                    this._current = i(0);
                    return function(t) {
                        return arc(i(t));
                    };
                }
                var availableWidth = width - margin.left - margin.right, availableHeight = height - margin.top - margin.bottom, radius = Math.min(availableWidth, availableHeight) / 2, arcRadius = radius - radius / 5, container = d3.select(this);
                var wrap = container.selectAll(".nv-wrap.nv-pie").data(data);
                var wrapEnter = wrap.enter().append("g").attr("class", "nvd3 nv-wrap nv-pie nv-chart-" + id);
                var gEnter = wrapEnter.append("g");
                var g = wrap.select("g");
                gEnter.append("g").attr("class", "nv-pie");
                gEnter.append("g").attr("class", "nv-pieLabels");
                wrap.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                g.select(".nv-pie").attr("transform", "translate(" + availableWidth / 2 + "," + availableHeight / 2 + ")");
                g.select(".nv-pieLabels").attr("transform", "translate(" + availableWidth / 2 + "," + availableHeight / 2 + ")");
                container.on("click", function(d, i) {
                    dispatch.chartClick({
                        data: d,
                        index: i,
                        pos: d3.event,
                        id: id
                    });
                });
                var arc = d3.svg.arc().outerRadius(arcRadius);
                startAngle && arc.startAngle(startAngle);
                endAngle && arc.endAngle(endAngle);
                donut && arc.innerRadius(radius * donutRatio);
                var pie = d3.layout.pie().sort(null).value(function(d) {
                    return d.disabled ? 0 : getY(d);
                });
                var slices = wrap.select(".nv-pie").selectAll(".nv-slice").data(pie);
                var pieLabels = wrap.select(".nv-pieLabels").selectAll(".nv-label").data(pie);
                slices.exit().remove();
                pieLabels.exit().remove();
                var ae = slices.enter().append("g").attr("class", "nv-slice").on("mouseover", function(d, i) {
                    d3.select(this).classed("hover", true);
                    dispatch.elementMouseover({
                        label: getX(d.data),
                        value: getY(d.data),
                        point: d.data,
                        pointIndex: i,
                        pos: [ d3.event.pageX, d3.event.pageY ],
                        id: id
                    });
                }).on("mouseout", function(d, i) {
                    d3.select(this).classed("hover", false);
                    dispatch.elementMouseout({
                        label: getX(d.data),
                        value: getY(d.data),
                        point: d.data,
                        index: i,
                        id: id
                    });
                }).on("click", function(d, i) {
                    dispatch.elementClick({
                        label: getX(d.data),
                        value: getY(d.data),
                        point: d.data,
                        index: i,
                        pos: d3.event,
                        id: id
                    });
                    d3.event.stopPropagation();
                }).on("dblclick", function(d, i) {
                    dispatch.elementDblClick({
                        label: getX(d.data),
                        value: getY(d.data),
                        point: d.data,
                        index: i,
                        pos: d3.event,
                        id: id
                    });
                    d3.event.stopPropagation();
                });
                slices.attr("fill", function(d, i) {
                    return color(d, i);
                }).attr("stroke", function(d, i) {
                    return color(d, i);
                });
                ae.append("path").each(function(d) {
                    this._current = d;
                });
                slices.select("path").transition().attr("d", arc).attrTween("d", arcTween);
                if (showLabels) {
                    var labelsArc = d3.svg.arc().innerRadius(0);
                    pieLabelsOutside && (labelsArc = arc);
                    donutLabelsOutside && (labelsArc = d3.svg.arc().outerRadius(arc.outerRadius()));
                    pieLabels.enter().append("g").classed("nv-label", true).each(function(d) {
                        var group = d3.select(this);
                        group.attr("transform", function(d) {
                            if (labelSunbeamLayout) {
                                d.outerRadius = arcRadius + 10;
                                d.innerRadius = arcRadius + 15;
                                var rotateAngle = (d.startAngle + d.endAngle) / 2 * (180 / Math.PI);
                                (d.startAngle + d.endAngle) / 2 < Math.PI ? rotateAngle -= 90 : rotateAngle += 90;
                                return "translate(" + labelsArc.centroid(d) + ") rotate(" + rotateAngle + ")";
                            }
                            d.outerRadius = radius + 10;
                            d.innerRadius = radius + 15;
                            return "translate(" + labelsArc.centroid(d) + ")";
                        });
                        group.append("rect").style("stroke", "#fff").style("fill", "#fff").attr("rx", 3).attr("ry", 3);
                        group.append("text").style("text-anchor", labelSunbeamLayout ? (d.startAngle + d.endAngle) / 2 < Math.PI ? "start" : "end" : "middle").style("fill", "#000");
                    });
                    var labelLocationHash = {};
                    var avgHeight = 14;
                    var avgWidth = 140;
                    var createHashKey = function(coordinates) {
                        return Math.floor(coordinates[0] / avgWidth) * avgWidth + "," + Math.floor(coordinates[1] / avgHeight) * avgHeight;
                    };
                    pieLabels.transition().attr("transform", function(d) {
                        if (labelSunbeamLayout) {
                            d.outerRadius = arcRadius + 10;
                            d.innerRadius = arcRadius + 15;
                            var rotateAngle = (d.startAngle + d.endAngle) / 2 * (180 / Math.PI);
                            (d.startAngle + d.endAngle) / 2 < Math.PI ? rotateAngle -= 90 : rotateAngle += 90;
                            return "translate(" + labelsArc.centroid(d) + ") rotate(" + rotateAngle + ")";
                        }
                        d.outerRadius = radius + 10;
                        d.innerRadius = radius + 15;
                        var center = labelsArc.centroid(d);
                        var hashKey = createHashKey(center);
                        labelLocationHash[hashKey] && (center[1] -= avgHeight);
                        labelLocationHash[createHashKey(center)] = true;
                        return "translate(" + center + ")";
                    });
                    pieLabels.select(".nv-label text").style("text-anchor", labelSunbeamLayout ? (d.startAngle + d.endAngle) / 2 < Math.PI ? "start" : "end" : "middle").text(function(d) {
                        var percent = (d.endAngle - d.startAngle) / (2 * Math.PI);
                        var labelTypes = {
                            key: getX(d.data),
                            value: getY(d.data),
                            percent: d3.format("%")(percent)
                        };
                        return d.value && percent > labelThreshold ? labelTypes[labelType] : "";
                    });
                }
            });
            return chart;
        }
        var margin = {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        }, width = 500, height = 500, getX = function(d) {
            return d.x;
        }, getY = function(d) {
            return d.y;
        }, getDescription = function(d) {
            return d.description;
        }, id = Math.floor(1e4 * Math.random()), color = nv.utils.defaultColor(), valueFormat = d3.format(",.2f"), showLabels = true, pieLabelsOutside = true, donutLabelsOutside = false, labelType = "key", labelThreshold = .02, donut = false, labelSunbeamLayout = false, startAngle = false, endAngle = false, donutRatio = .5, dispatch = d3.dispatch("chartClick", "elementClick", "elementDblClick", "elementMouseover", "elementMouseout");
        chart.dispatch = dispatch;
        chart.options = nv.utils.optionsFunc.bind(chart);
        chart.margin = function(_) {
            if (!arguments.length) return margin;
            margin.top = "undefined" != typeof _.top ? _.top : margin.top;
            margin.right = "undefined" != typeof _.right ? _.right : margin.right;
            margin.bottom = "undefined" != typeof _.bottom ? _.bottom : margin.bottom;
            margin.left = "undefined" != typeof _.left ? _.left : margin.left;
            return chart;
        };
        chart.width = function(_) {
            if (!arguments.length) return width;
            width = _;
            return chart;
        };
        chart.height = function(_) {
            if (!arguments.length) return height;
            height = _;
            return chart;
        };
        chart.values = function() {
            nv.log("pie.values() is no longer supported.");
            return chart;
        };
        chart.x = function(_) {
            if (!arguments.length) return getX;
            getX = _;
            return chart;
        };
        chart.y = function(_) {
            if (!arguments.length) return getY;
            getY = d3.functor(_);
            return chart;
        };
        chart.description = function(_) {
            if (!arguments.length) return getDescription;
            getDescription = _;
            return chart;
        };
        chart.showLabels = function(_) {
            if (!arguments.length) return showLabels;
            showLabels = _;
            return chart;
        };
        chart.labelSunbeamLayout = function(_) {
            if (!arguments.length) return labelSunbeamLayout;
            labelSunbeamLayout = _;
            return chart;
        };
        chart.donutLabelsOutside = function(_) {
            if (!arguments.length) return donutLabelsOutside;
            donutLabelsOutside = _;
            return chart;
        };
        chart.pieLabelsOutside = function(_) {
            if (!arguments.length) return pieLabelsOutside;
            pieLabelsOutside = _;
            return chart;
        };
        chart.labelType = function(_) {
            if (!arguments.length) return labelType;
            labelType = _;
            labelType = labelType || "key";
            return chart;
        };
        chart.donut = function(_) {
            if (!arguments.length) return donut;
            donut = _;
            return chart;
        };
        chart.donutRatio = function(_) {
            if (!arguments.length) return donutRatio;
            donutRatio = _;
            return chart;
        };
        chart.startAngle = function(_) {
            if (!arguments.length) return startAngle;
            startAngle = _;
            return chart;
        };
        chart.endAngle = function(_) {
            if (!arguments.length) return endAngle;
            endAngle = _;
            return chart;
        };
        chart.id = function(_) {
            if (!arguments.length) return id;
            id = _;
            return chart;
        };
        chart.color = function(_) {
            if (!arguments.length) return color;
            color = nv.utils.getColor(_);
            return chart;
        };
        chart.valueFormat = function(_) {
            if (!arguments.length) return valueFormat;
            valueFormat = _;
            return chart;
        };
        chart.labelThreshold = function(_) {
            if (!arguments.length) return labelThreshold;
            labelThreshold = _;
            return chart;
        };
        return chart;
    };
    nv.models.pieChart = function() {
        "use strict";
        function chart(selection) {
            selection.each(function(data) {
                var container = d3.select(this);
                var availableWidth = (width || parseInt(container.style("width")) || 960) - margin.left - margin.right, availableHeight = (height || parseInt(container.style("height")) || 400) - margin.top - margin.bottom;
                chart.update = function() {
                    container.transition().call(chart);
                };
                chart.container = this;
                state.disabled = data.map(function(d) {
                    return !!d.disabled;
                });
                if (!defaultState) {
                    var key;
                    defaultState = {};
                    for (key in state) defaultState[key] = state[key] instanceof Array ? state[key].slice(0) : state[key];
                }
                if (!data || !data.length) {
                    var noDataText = container.selectAll(".nv-noData").data([ noData ]);
                    noDataText.enter().append("text").attr("class", "nvd3 nv-noData").attr("dy", "-.7em").style("text-anchor", "middle");
                    noDataText.attr("x", margin.left + availableWidth / 2).attr("y", margin.top + availableHeight / 2).text(function(d) {
                        return d;
                    });
                    return chart;
                }
                container.selectAll(".nv-noData").remove();
                var wrap = container.selectAll("g.nv-wrap.nv-pieChart").data([ data ]);
                var gEnter = wrap.enter().append("g").attr("class", "nvd3 nv-wrap nv-pieChart").append("g");
                var g = wrap.select("g");
                gEnter.append("g").attr("class", "nv-pieWrap");
                gEnter.append("g").attr("class", "nv-legendWrap");
                if (showLegend) {
                    legend.width(availableWidth).key(pie.x());
                    wrap.select(".nv-legendWrap").datum(data).call(legend);
                    if (margin.top != legend.height()) {
                        margin.top = legend.height();
                        availableHeight = (height || parseInt(container.style("height")) || 400) - margin.top - margin.bottom;
                    }
                    wrap.select(".nv-legendWrap").attr("transform", "translate(0," + -margin.top + ")");
                }
                wrap.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                pie.width(availableWidth).height(availableHeight);
                var pieWrap = g.select(".nv-pieWrap").datum([ data ]);
                d3.transition(pieWrap).call(pie);
                legend.dispatch.on("stateChange", function(newState) {
                    state = newState;
                    dispatch.stateChange(state);
                    chart.update();
                });
                pie.dispatch.on("elementMouseout.tooltip", function(e) {
                    dispatch.tooltipHide(e);
                });
                dispatch.on("changeState", function(e) {
                    if ("undefined" != typeof e.disabled) {
                        data.forEach(function(series, i) {
                            series.disabled = e.disabled[i];
                        });
                        state.disabled = e.disabled;
                    }
                    chart.update();
                });
            });
            return chart;
        }
        var pie = nv.models.pie(), legend = nv.models.legend();
        var margin = {
            top: 30,
            right: 20,
            bottom: 20,
            left: 20
        }, width = null, height = null, showLegend = true, color = nv.utils.defaultColor(), tooltips = true, tooltip = function(key, y) {
            return "<h3>" + key + "</h3>" + "<p>" + y + "</p>";
        }, state = {}, defaultState = null, noData = "No Data Available.", dispatch = d3.dispatch("tooltipShow", "tooltipHide", "stateChange", "changeState");
        var showTooltip = function(e, offsetElement) {
            var tooltipLabel = pie.description()(e.point) || pie.x()(e.point);
            var left = e.pos[0] + (offsetElement && offsetElement.offsetLeft || 0), top = e.pos[1] + (offsetElement && offsetElement.offsetTop || 0), y = pie.valueFormat()(pie.y()(e.point)), content = tooltip(tooltipLabel, y, e, chart);
            nv.tooltip.show([ left, top ], content, 0 > e.value ? "n" : "s", null, offsetElement);
        };
        pie.dispatch.on("elementMouseover.tooltip", function(e) {
            e.pos = [ e.pos[0] + margin.left, e.pos[1] + margin.top ];
            dispatch.tooltipShow(e);
        });
        dispatch.on("tooltipShow", function(e) {
            tooltips && showTooltip(e);
        });
        dispatch.on("tooltipHide", function() {
            tooltips && nv.tooltip.cleanup();
        });
        chart.legend = legend;
        chart.dispatch = dispatch;
        chart.pie = pie;
        d3.rebind(chart, pie, "valueFormat", "values", "x", "y", "description", "id", "showLabels", "donutLabelsOutside", "pieLabelsOutside", "labelType", "donut", "donutRatio", "labelThreshold");
        chart.options = nv.utils.optionsFunc.bind(chart);
        chart.margin = function(_) {
            if (!arguments.length) return margin;
            margin.top = "undefined" != typeof _.top ? _.top : margin.top;
            margin.right = "undefined" != typeof _.right ? _.right : margin.right;
            margin.bottom = "undefined" != typeof _.bottom ? _.bottom : margin.bottom;
            margin.left = "undefined" != typeof _.left ? _.left : margin.left;
            return chart;
        };
        chart.width = function(_) {
            if (!arguments.length) return width;
            width = _;
            return chart;
        };
        chart.height = function(_) {
            if (!arguments.length) return height;
            height = _;
            return chart;
        };
        chart.color = function(_) {
            if (!arguments.length) return color;
            color = nv.utils.getColor(_);
            legend.color(color);
            pie.color(color);
            return chart;
        };
        chart.showLegend = function(_) {
            if (!arguments.length) return showLegend;
            showLegend = _;
            return chart;
        };
        chart.tooltips = function(_) {
            if (!arguments.length) return tooltips;
            tooltips = _;
            return chart;
        };
        chart.tooltipContent = function(_) {
            if (!arguments.length) return tooltip;
            tooltip = _;
            return chart;
        };
        chart.state = function(_) {
            if (!arguments.length) return state;
            state = _;
            return chart;
        };
        chart.defaultState = function(_) {
            if (!arguments.length) return defaultState;
            defaultState = _;
            return chart;
        };
        chart.noData = function(_) {
            if (!arguments.length) return noData;
            noData = _;
            return chart;
        };
        return chart;
    };
    nv.models.scatter = function() {
        "use strict";
        function chart(selection) {
            selection.each(function(data) {
                function updateInteractiveLayer() {
                    if (!interactive) return false;
                    var vertices = d3.merge(data.map(function(group, groupIndex) {
                        return group.values.map(function(point, pointIndex) {
                            var pX = getX(point, pointIndex);
                            var pY = getY(point, pointIndex);
                            return [ x(pX) + 1e-7 * Math.random(), y(pY) + 1e-7 * Math.random(), groupIndex, pointIndex, point ];
                        }).filter(function(pointArray, pointIndex) {
                            return pointActive(pointArray[4], pointIndex);
                        });
                    }));
                    if (true === useVoronoi) {
                        if (clipVoronoi) {
                            var pointClipsEnter = wrap.select("defs").selectAll(".nv-point-clips").data([ id ]).enter();
                            pointClipsEnter.append("clipPath").attr("class", "nv-point-clips").attr("id", "nv-points-clip-" + id);
                            var pointClips = wrap.select("#nv-points-clip-" + id).selectAll("circle").data(vertices);
                            pointClips.enter().append("circle").attr("r", clipRadius);
                            pointClips.exit().remove();
                            pointClips.attr("cx", function(d) {
                                return d[0];
                            }).attr("cy", function(d) {
                                return d[1];
                            });
                            wrap.select(".nv-point-paths").attr("clip-path", "url(#nv-points-clip-" + id + ")");
                        }
                        if (vertices.length) {
                            vertices.push([ x.range()[0] - 20, y.range()[0] - 20, null, null ]);
                            vertices.push([ x.range()[1] + 20, y.range()[1] + 20, null, null ]);
                            vertices.push([ x.range()[0] - 20, y.range()[0] + 20, null, null ]);
                            vertices.push([ x.range()[1] + 20, y.range()[1] - 20, null, null ]);
                        }
                        var bounds = d3.geom.polygon([ [ -10, -10 ], [ -10, height + 10 ], [ width + 10, height + 10 ], [ width + 10, -10 ] ]);
                        var voronoi = d3.geom.voronoi(vertices).map(function(d, i) {
                            return {
                                data: bounds.clip(d),
                                series: vertices[i][2],
                                point: vertices[i][3]
                            };
                        });
                        var pointPaths = wrap.select(".nv-point-paths").selectAll("path").data(voronoi);
                        pointPaths.enter().append("path").attr("class", function(d, i) {
                            return "nv-path-" + i;
                        });
                        pointPaths.exit().remove();
                        pointPaths.attr("d", function(d) {
                            return 0 === d.data.length ? "M 0 0" : "M" + d.data.join("L") + "Z";
                        });
                        var mouseEventCallback = function(d, mDispatch) {
                            if (needsUpdate) return 0;
                            var series = data[d.series];
                            if ("undefined" == typeof series) return;
                            var point = series.values[d.point];
                            mDispatch({
                                point: point,
                                series: series,
                                pos: [ x(getX(point, d.point)) + margin.left, y(getY(point, d.point)) + margin.top ],
                                seriesIndex: d.series,
                                pointIndex: d.point
                            });
                        };
                        pointPaths.on("click", function(d) {
                            mouseEventCallback(d, dispatch.elementClick);
                        }).on("mouseover", function(d) {
                            mouseEventCallback(d, dispatch.elementMouseover);
                        }).on("mouseout", function(d) {
                            mouseEventCallback(d, dispatch.elementMouseout);
                        });
                    } else wrap.select(".nv-groups").selectAll(".nv-group").selectAll(".nv-point").on("click", function(d, i) {
                        if (needsUpdate || !data[d.series]) return 0;
                        var series = data[d.series], point = series.values[i];
                        dispatch.elementClick({
                            point: point,
                            series: series,
                            pos: [ x(getX(point, i)) + margin.left, y(getY(point, i)) + margin.top ],
                            seriesIndex: d.series,
                            pointIndex: i
                        });
                    }).on("mouseover", function(d, i) {
                        if (needsUpdate || !data[d.series]) return 0;
                        var series = data[d.series], point = series.values[i];
                        dispatch.elementMouseover({
                            point: point,
                            series: series,
                            pos: [ x(getX(point, i)) + margin.left, y(getY(point, i)) + margin.top ],
                            seriesIndex: d.series,
                            pointIndex: i
                        });
                    }).on("mouseout", function(d, i) {
                        if (needsUpdate || !data[d.series]) return 0;
                        var series = data[d.series], point = series.values[i];
                        dispatch.elementMouseout({
                            point: point,
                            series: series,
                            seriesIndex: d.series,
                            pointIndex: i
                        });
                    });
                    needsUpdate = false;
                }
                var availableWidth = width - margin.left - margin.right, availableHeight = height - margin.top - margin.bottom, container = d3.select(this);
                data.forEach(function(series, i) {
                    series.values.forEach(function(point) {
                        point.series = i;
                    });
                });
                var seriesData = xDomain && yDomain && sizeDomain ? [] : d3.merge(data.map(function(d) {
                    return d.values.map(function(d, i) {
                        return {
                            x: getX(d, i),
                            y: getY(d, i),
                            size: getSize(d, i)
                        };
                    });
                }));
                x.domain(xDomain || d3.extent(seriesData.map(function(d) {
                    return d.x;
                }).concat(forceX)));
                padData && data[0] ? x.range(xRange || [ (availableWidth * padDataOuter + availableWidth) / (2 * data[0].values.length), availableWidth - availableWidth * (1 + padDataOuter) / (2 * data[0].values.length) ]) : x.range(xRange || [ 0, availableWidth ]);
                y.domain(yDomain || d3.extent(seriesData.map(function(d) {
                    return d.y;
                }).concat(forceY))).range(yRange || [ availableHeight, 0 ]);
                z.domain(sizeDomain || d3.extent(seriesData.map(function(d) {
                    return d.size;
                }).concat(forceSize))).range(sizeRange || [ 16, 256 ]);
                (x.domain()[0] === x.domain()[1] || y.domain()[0] === y.domain()[1]) && (singlePoint = true);
                x.domain()[0] === x.domain()[1] && (x.domain()[0] ? x.domain([ x.domain()[0] - .01 * x.domain()[0], x.domain()[1] + .01 * x.domain()[1] ]) : x.domain([ -1, 1 ]));
                y.domain()[0] === y.domain()[1] && (y.domain()[0] ? y.domain([ y.domain()[0] - .01 * y.domain()[0], y.domain()[1] + .01 * y.domain()[1] ]) : y.domain([ -1, 1 ]));
                isNaN(x.domain()[0]) && x.domain([ -1, 1 ]);
                isNaN(y.domain()[0]) && y.domain([ -1, 1 ]);
                x0 = x0 || x;
                y0 = y0 || y;
                z0 = z0 || z;
                var wrap = container.selectAll("g.nv-wrap.nv-scatter").data([ data ]);
                var wrapEnter = wrap.enter().append("g").attr("class", "nvd3 nv-wrap nv-scatter nv-chart-" + id + (singlePoint ? " nv-single-point" : ""));
                var defsEnter = wrapEnter.append("defs");
                var gEnter = wrapEnter.append("g");
                var g = wrap.select("g");
                gEnter.append("g").attr("class", "nv-groups");
                gEnter.append("g").attr("class", "nv-point-paths");
                wrap.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                defsEnter.append("clipPath").attr("id", "nv-edge-clip-" + id).append("rect");
                wrap.select("#nv-edge-clip-" + id + " rect").attr("width", availableWidth).attr("height", availableHeight > 0 ? availableHeight : 0);
                g.attr("clip-path", clipEdge ? "url(#nv-edge-clip-" + id + ")" : "");
                needsUpdate = true;
                var groups = wrap.select(".nv-groups").selectAll(".nv-group").data(function(d) {
                    return d;
                }, function(d) {
                    return d.key;
                });
                groups.enter().append("g").style("stroke-opacity", 1e-6).style("fill-opacity", 1e-6);
                groups.exit().remove();
                groups.attr("class", function(d, i) {
                    return "nv-group nv-series-" + i;
                }).classed("hover", function(d) {
                    return d.hover;
                });
                groups.transition().style("fill", function(d, i) {
                    return color(d, i);
                }).style("stroke", function(d, i) {
                    return color(d, i);
                }).style("stroke-opacity", 1).style("fill-opacity", .5);
                if (onlyCircles) {
                    var points = groups.selectAll("circle.nv-point").data(function(d) {
                        return d.values;
                    }, pointKey);
                    points.enter().append("circle").style("fill", function(d) {
                        return d.color;
                    }).style("stroke", function(d) {
                        return d.color;
                    }).attr("cx", function(d, i) {
                        return nv.utils.NaNtoZero(x0(getX(d, i)));
                    }).attr("cy", function(d, i) {
                        return nv.utils.NaNtoZero(y0(getY(d, i)));
                    }).attr("r", function(d, i) {
                        return Math.sqrt(z(getSize(d, i)) / Math.PI);
                    });
                    points.exit().remove();
                    groups.exit().selectAll("path.nv-point").transition().attr("cx", function(d, i) {
                        return nv.utils.NaNtoZero(x(getX(d, i)));
                    }).attr("cy", function(d, i) {
                        return nv.utils.NaNtoZero(y(getY(d, i)));
                    }).remove();
                    points.each(function(d, i) {
                        d3.select(this).classed("nv-point", true).classed("nv-point-" + i, true).classed("hover", false);
                    });
                    points.transition().attr("cx", function(d, i) {
                        return nv.utils.NaNtoZero(x(getX(d, i)));
                    }).attr("cy", function(d, i) {
                        return nv.utils.NaNtoZero(y(getY(d, i)));
                    }).attr("r", function(d, i) {
                        return Math.sqrt(z(getSize(d, i)) / Math.PI);
                    });
                } else {
                    var points = groups.selectAll("path.nv-point").data(function(d) {
                        return d.values;
                    });
                    points.enter().append("path").style("fill", function(d) {
                        return d.color;
                    }).style("stroke", function(d) {
                        return d.color;
                    }).attr("transform", function(d, i) {
                        return "translate(" + x0(getX(d, i)) + "," + y0(getY(d, i)) + ")";
                    }).attr("d", d3.svg.symbol().type(getShape).size(function(d, i) {
                        return z(getSize(d, i));
                    }));
                    points.exit().remove();
                    groups.exit().selectAll("path.nv-point").transition().attr("transform", function(d, i) {
                        return "translate(" + x(getX(d, i)) + "," + y(getY(d, i)) + ")";
                    }).remove();
                    points.each(function(d, i) {
                        d3.select(this).classed("nv-point", true).classed("nv-point-" + i, true).classed("hover", false);
                    });
                    points.transition().attr("transform", function(d, i) {
                        return "translate(" + x(getX(d, i)) + "," + y(getY(d, i)) + ")";
                    }).attr("d", d3.svg.symbol().type(getShape).size(function(d, i) {
                        return z(getSize(d, i));
                    }));
                }
                clearTimeout(timeoutID);
                timeoutID = setTimeout(updateInteractiveLayer, 300);
                x0 = x.copy();
                y0 = y.copy();
                z0 = z.copy();
            });
            return chart;
        }
        var margin = {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        }, width = 960, height = 500, color = nv.utils.defaultColor(), id = Math.floor(1e5 * Math.random()), x = d3.scale.linear(), y = d3.scale.linear(), z = d3.scale.linear(), getX = function(d) {
            return d.x;
        }, getY = function(d) {
            return d.y;
        }, getSize = function(d) {
            return d.size || 1;
        }, getShape = function(d) {
            return d.shape || "circle";
        }, onlyCircles = true, forceX = [], forceY = [], forceSize = [], interactive = true, pointKey = null, pointActive = function(d) {
            return !d.notActive;
        }, padData = false, padDataOuter = .1, clipEdge = false, clipVoronoi = true, clipRadius = function() {
            return 25;
        }, xDomain = null, yDomain = null, xRange = null, yRange = null, sizeDomain = null, sizeRange = null, singlePoint = false, dispatch = d3.dispatch("elementClick", "elementMouseover", "elementMouseout"), useVoronoi = true;
        var x0, y0, z0, timeoutID, needsUpdate = false;
        chart.clearHighlights = function() {
            d3.selectAll(".nv-chart-" + id + " .nv-point.hover").classed("hover", false);
        };
        chart.highlightPoint = function(seriesIndex, pointIndex, isHoverOver) {
            d3.select(".nv-chart-" + id + " .nv-series-" + seriesIndex + " .nv-point-" + pointIndex).classed("hover", isHoverOver);
        };
        dispatch.on("elementMouseover.point", function(d) {
            interactive && chart.highlightPoint(d.seriesIndex, d.pointIndex, true);
        });
        dispatch.on("elementMouseout.point", function(d) {
            interactive && chart.highlightPoint(d.seriesIndex, d.pointIndex, false);
        });
        chart.dispatch = dispatch;
        chart.options = nv.utils.optionsFunc.bind(chart);
        chart.x = function(_) {
            if (!arguments.length) return getX;
            getX = d3.functor(_);
            return chart;
        };
        chart.y = function(_) {
            if (!arguments.length) return getY;
            getY = d3.functor(_);
            return chart;
        };
        chart.size = function(_) {
            if (!arguments.length) return getSize;
            getSize = d3.functor(_);
            return chart;
        };
        chart.margin = function(_) {
            if (!arguments.length) return margin;
            margin.top = "undefined" != typeof _.top ? _.top : margin.top;
            margin.right = "undefined" != typeof _.right ? _.right : margin.right;
            margin.bottom = "undefined" != typeof _.bottom ? _.bottom : margin.bottom;
            margin.left = "undefined" != typeof _.left ? _.left : margin.left;
            return chart;
        };
        chart.width = function(_) {
            if (!arguments.length) return width;
            width = _;
            return chart;
        };
        chart.height = function(_) {
            if (!arguments.length) return height;
            height = _;
            return chart;
        };
        chart.xScale = function(_) {
            if (!arguments.length) return x;
            x = _;
            return chart;
        };
        chart.yScale = function(_) {
            if (!arguments.length) return y;
            y = _;
            return chart;
        };
        chart.zScale = function(_) {
            if (!arguments.length) return z;
            z = _;
            return chart;
        };
        chart.xDomain = function(_) {
            if (!arguments.length) return xDomain;
            xDomain = _;
            return chart;
        };
        chart.yDomain = function(_) {
            if (!arguments.length) return yDomain;
            yDomain = _;
            return chart;
        };
        chart.sizeDomain = function(_) {
            if (!arguments.length) return sizeDomain;
            sizeDomain = _;
            return chart;
        };
        chart.xRange = function(_) {
            if (!arguments.length) return xRange;
            xRange = _;
            return chart;
        };
        chart.yRange = function(_) {
            if (!arguments.length) return yRange;
            yRange = _;
            return chart;
        };
        chart.sizeRange = function(_) {
            if (!arguments.length) return sizeRange;
            sizeRange = _;
            return chart;
        };
        chart.forceX = function(_) {
            if (!arguments.length) return forceX;
            forceX = _;
            return chart;
        };
        chart.forceY = function(_) {
            if (!arguments.length) return forceY;
            forceY = _;
            return chart;
        };
        chart.forceSize = function(_) {
            if (!arguments.length) return forceSize;
            forceSize = _;
            return chart;
        };
        chart.interactive = function(_) {
            if (!arguments.length) return interactive;
            interactive = _;
            return chart;
        };
        chart.pointKey = function(_) {
            if (!arguments.length) return pointKey;
            pointKey = _;
            return chart;
        };
        chart.pointActive = function(_) {
            if (!arguments.length) return pointActive;
            pointActive = _;
            return chart;
        };
        chart.padData = function(_) {
            if (!arguments.length) return padData;
            padData = _;
            return chart;
        };
        chart.padDataOuter = function(_) {
            if (!arguments.length) return padDataOuter;
            padDataOuter = _;
            return chart;
        };
        chart.clipEdge = function(_) {
            if (!arguments.length) return clipEdge;
            clipEdge = _;
            return chart;
        };
        chart.clipVoronoi = function(_) {
            if (!arguments.length) return clipVoronoi;
            clipVoronoi = _;
            return chart;
        };
        chart.useVoronoi = function(_) {
            if (!arguments.length) return useVoronoi;
            useVoronoi = _;
            false === useVoronoi && (clipVoronoi = false);
            return chart;
        };
        chart.clipRadius = function(_) {
            if (!arguments.length) return clipRadius;
            clipRadius = _;
            return chart;
        };
        chart.color = function(_) {
            if (!arguments.length) return color;
            color = nv.utils.getColor(_);
            return chart;
        };
        chart.shape = function(_) {
            if (!arguments.length) return getShape;
            getShape = _;
            return chart;
        };
        chart.onlyCircles = function(_) {
            if (!arguments.length) return onlyCircles;
            onlyCircles = _;
            return chart;
        };
        chart.id = function(_) {
            if (!arguments.length) return id;
            id = _;
            return chart;
        };
        chart.singlePoint = function(_) {
            if (!arguments.length) return singlePoint;
            singlePoint = _;
            return chart;
        };
        return chart;
    };
    nv.models.scatterChart = function() {
        "use strict";
        function chart(selection) {
            selection.each(function(data) {
                function updateFisheye() {
                    if (pauseFisheye) {
                        g.select(".nv-point-paths").style("pointer-events", "all");
                        return false;
                    }
                    g.select(".nv-point-paths").style("pointer-events", "none");
                    var mouse = d3.mouse(this);
                    x.distortion(fisheye).focus(mouse[0]);
                    y.distortion(fisheye).focus(mouse[1]);
                    g.select(".nv-scatterWrap").call(scatter);
                    showXAxis && g.select(".nv-x.nv-axis").call(xAxis);
                    showYAxis && g.select(".nv-y.nv-axis").call(yAxis);
                    g.select(".nv-distributionX").datum(data.filter(function(d) {
                        return !d.disabled;
                    })).call(distX);
                    g.select(".nv-distributionY").datum(data.filter(function(d) {
                        return !d.disabled;
                    })).call(distY);
                }
                var container = d3.select(this), that = this;
                var availableWidth = (width || parseInt(container.style("width")) || 960) - margin.left - margin.right, availableHeight = (height || parseInt(container.style("height")) || 400) - margin.top - margin.bottom;
                chart.update = function() {
                    container.transition().duration(transitionDuration).call(chart);
                };
                chart.container = this;
                state.disabled = data.map(function(d) {
                    return !!d.disabled;
                });
                if (!defaultState) {
                    var key;
                    defaultState = {};
                    for (key in state) defaultState[key] = state[key] instanceof Array ? state[key].slice(0) : state[key];
                }
                if (!(data && data.length && data.filter(function(d) {
                    return d.values.length;
                }).length)) {
                    var noDataText = container.selectAll(".nv-noData").data([ noData ]);
                    noDataText.enter().append("text").attr("class", "nvd3 nv-noData").attr("dy", "-.7em").style("text-anchor", "middle");
                    noDataText.attr("x", margin.left + availableWidth / 2).attr("y", margin.top + availableHeight / 2).text(function(d) {
                        return d;
                    });
                    return chart;
                }
                container.selectAll(".nv-noData").remove();
                x0 = x0 || x;
                y0 = y0 || y;
                var wrap = container.selectAll("g.nv-wrap.nv-scatterChart").data([ data ]);
                var wrapEnter = wrap.enter().append("g").attr("class", "nvd3 nv-wrap nv-scatterChart nv-chart-" + scatter.id());
                var gEnter = wrapEnter.append("g");
                var g = wrap.select("g");
                gEnter.append("rect").attr("class", "nvd3 nv-background");
                gEnter.append("g").attr("class", "nv-x nv-axis");
                gEnter.append("g").attr("class", "nv-y nv-axis");
                gEnter.append("g").attr("class", "nv-scatterWrap");
                gEnter.append("g").attr("class", "nv-distWrap");
                gEnter.append("g").attr("class", "nv-legendWrap");
                gEnter.append("g").attr("class", "nv-controlsWrap");
                if (showLegend) {
                    var legendWidth = showControls ? availableWidth / 2 : availableWidth;
                    legend.width(legendWidth);
                    wrap.select(".nv-legendWrap").datum(data).call(legend);
                    if (margin.top != legend.height()) {
                        margin.top = legend.height();
                        availableHeight = (height || parseInt(container.style("height")) || 400) - margin.top - margin.bottom;
                    }
                    wrap.select(".nv-legendWrap").attr("transform", "translate(" + (availableWidth - legendWidth) + "," + -margin.top + ")");
                }
                if (showControls) {
                    controls.width(180).color([ "#444" ]);
                    g.select(".nv-controlsWrap").datum(controlsData).attr("transform", "translate(0," + -margin.top + ")").call(controls);
                }
                wrap.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                rightAlignYAxis && g.select(".nv-y.nv-axis").attr("transform", "translate(" + availableWidth + ",0)");
                scatter.width(availableWidth).height(availableHeight).color(data.map(function(d, i) {
                    return d.color || color(d, i);
                }).filter(function(d, i) {
                    return !data[i].disabled;
                }));
                0 !== xPadding && scatter.xDomain(null);
                0 !== yPadding && scatter.yDomain(null);
                wrap.select(".nv-scatterWrap").datum(data.filter(function(d) {
                    return !d.disabled;
                })).call(scatter);
                if (0 !== xPadding) {
                    var xRange = x.domain()[1] - x.domain()[0];
                    scatter.xDomain([ x.domain()[0] - xPadding * xRange, x.domain()[1] + xPadding * xRange ]);
                }
                if (0 !== yPadding) {
                    var yRange = y.domain()[1] - y.domain()[0];
                    scatter.yDomain([ y.domain()[0] - yPadding * yRange, y.domain()[1] + yPadding * yRange ]);
                }
                (0 !== yPadding || 0 !== xPadding) && wrap.select(".nv-scatterWrap").datum(data.filter(function(d) {
                    return !d.disabled;
                })).call(scatter);
                if (showXAxis) {
                    xAxis.scale(x).ticks(xAxis.ticks() && xAxis.ticks().length ? xAxis.ticks() : availableWidth / 100).tickSize(-availableHeight, 0);
                    g.select(".nv-x.nv-axis").attr("transform", "translate(0," + y.range()[0] + ")").call(xAxis);
                }
                if (showYAxis) {
                    yAxis.scale(y).ticks(yAxis.ticks() && yAxis.ticks().length ? yAxis.ticks() : availableHeight / 36).tickSize(-availableWidth, 0);
                    g.select(".nv-y.nv-axis").call(yAxis);
                }
                if (showDistX) {
                    distX.getData(scatter.x()).scale(x).width(availableWidth).color(data.map(function(d, i) {
                        return d.color || color(d, i);
                    }).filter(function(d, i) {
                        return !data[i].disabled;
                    }));
                    gEnter.select(".nv-distWrap").append("g").attr("class", "nv-distributionX");
                    g.select(".nv-distributionX").attr("transform", "translate(0," + y.range()[0] + ")").datum(data.filter(function(d) {
                        return !d.disabled;
                    })).call(distX);
                }
                if (showDistY) {
                    distY.getData(scatter.y()).scale(y).width(availableHeight).color(data.map(function(d, i) {
                        return d.color || color(d, i);
                    }).filter(function(d, i) {
                        return !data[i].disabled;
                    }));
                    gEnter.select(".nv-distWrap").append("g").attr("class", "nv-distributionY");
                    g.select(".nv-distributionY").attr("transform", "translate(" + (rightAlignYAxis ? availableWidth : -distY.size()) + ",0)").datum(data.filter(function(d) {
                        return !d.disabled;
                    })).call(distY);
                }
                if (d3.fisheye) {
                    g.select(".nv-background").attr("width", availableWidth).attr("height", availableHeight);
                    g.select(".nv-background").on("mousemove", updateFisheye);
                    g.select(".nv-background").on("click", function() {
                        pauseFisheye = !pauseFisheye;
                    });
                    scatter.dispatch.on("elementClick.freezeFisheye", function() {
                        pauseFisheye = !pauseFisheye;
                    });
                }
                controls.dispatch.on("legendClick", function(d) {
                    d.disabled = !d.disabled;
                    fisheye = d.disabled ? 0 : 2.5;
                    g.select(".nv-background").style("pointer-events", d.disabled ? "none" : "all");
                    g.select(".nv-point-paths").style("pointer-events", d.disabled ? "all" : "none");
                    if (d.disabled) {
                        x.distortion(fisheye).focus(0);
                        y.distortion(fisheye).focus(0);
                        g.select(".nv-scatterWrap").call(scatter);
                        g.select(".nv-x.nv-axis").call(xAxis);
                        g.select(".nv-y.nv-axis").call(yAxis);
                    } else pauseFisheye = false;
                    chart.update();
                });
                legend.dispatch.on("stateChange", function(newState) {
                    state.disabled = newState.disabled;
                    dispatch.stateChange(state);
                    chart.update();
                });
                scatter.dispatch.on("elementMouseover.tooltip", function(e) {
                    d3.select(".nv-chart-" + scatter.id() + " .nv-series-" + e.seriesIndex + " .nv-distx-" + e.pointIndex).attr("y1", function() {
                        return e.pos[1] - availableHeight;
                    });
                    d3.select(".nv-chart-" + scatter.id() + " .nv-series-" + e.seriesIndex + " .nv-disty-" + e.pointIndex).attr("x2", e.pos[0] + distX.size());
                    e.pos = [ e.pos[0] + margin.left, e.pos[1] + margin.top ];
                    dispatch.tooltipShow(e);
                });
                dispatch.on("tooltipShow", function(e) {
                    tooltips && showTooltip(e, that.parentNode);
                });
                dispatch.on("changeState", function(e) {
                    if ("undefined" != typeof e.disabled) {
                        data.forEach(function(series, i) {
                            series.disabled = e.disabled[i];
                        });
                        state.disabled = e.disabled;
                    }
                    chart.update();
                });
                x0 = x.copy();
                y0 = y.copy();
            });
            return chart;
        }
        var scatter = nv.models.scatter(), xAxis = nv.models.axis(), yAxis = nv.models.axis(), legend = nv.models.legend(), controls = nv.models.legend(), distX = nv.models.distribution(), distY = nv.models.distribution();
        var margin = {
            top: 30,
            right: 20,
            bottom: 50,
            left: 75
        }, width = null, height = null, color = nv.utils.defaultColor(), x = d3.fisheye ? d3.fisheye.scale(d3.scale.linear).distortion(0) : scatter.xScale(), y = d3.fisheye ? d3.fisheye.scale(d3.scale.linear).distortion(0) : scatter.yScale(), xPadding = 0, yPadding = 0, showDistX = false, showDistY = false, showLegend = true, showXAxis = true, showYAxis = true, rightAlignYAxis = false, showControls = !!d3.fisheye, fisheye = 0, pauseFisheye = false, tooltips = true, tooltipX = function(key, x) {
            return "<strong>" + x + "</strong>";
        }, tooltipY = function(key, x, y) {
            return "<strong>" + y + "</strong>";
        }, tooltip = null, state = {}, defaultState = null, dispatch = d3.dispatch("tooltipShow", "tooltipHide", "stateChange", "changeState"), noData = "No Data Available.", transitionDuration = 250;
        scatter.xScale(x).yScale(y);
        xAxis.orient("bottom").tickPadding(10);
        yAxis.orient(rightAlignYAxis ? "right" : "left").tickPadding(10);
        distX.axis("x");
        distY.axis("y");
        controls.updateState(false);
        var x0, y0;
        var showTooltip = function(e, offsetElement) {
            var left = e.pos[0] + (offsetElement.offsetLeft || 0), top = e.pos[1] + (offsetElement.offsetTop || 0), leftX = e.pos[0] + (offsetElement.offsetLeft || 0), topX = y.range()[0] + margin.top + (offsetElement.offsetTop || 0), leftY = x.range()[0] + margin.left + (offsetElement.offsetLeft || 0), topY = e.pos[1] + (offsetElement.offsetTop || 0), xVal = xAxis.tickFormat()(scatter.x()(e.point, e.pointIndex)), yVal = yAxis.tickFormat()(scatter.y()(e.point, e.pointIndex));
            null != tooltipX && nv.tooltip.show([ leftX, topX ], tooltipX(e.series.key, xVal, yVal, e, chart), "n", 1, offsetElement, "x-nvtooltip");
            null != tooltipY && nv.tooltip.show([ leftY, topY ], tooltipY(e.series.key, xVal, yVal, e, chart), "e", 1, offsetElement, "y-nvtooltip");
            null != tooltip && nv.tooltip.show([ left, top ], tooltip(e.series.key, xVal, yVal, e, chart), 0 > e.value ? "n" : "s", null, offsetElement);
        };
        var controlsData = [ {
            key: "Magnify",
            disabled: true
        } ];
        scatter.dispatch.on("elementMouseout.tooltip", function(e) {
            dispatch.tooltipHide(e);
            d3.select(".nv-chart-" + scatter.id() + " .nv-series-" + e.seriesIndex + " .nv-distx-" + e.pointIndex).attr("y1", 0);
            d3.select(".nv-chart-" + scatter.id() + " .nv-series-" + e.seriesIndex + " .nv-disty-" + e.pointIndex).attr("x2", distY.size());
        });
        dispatch.on("tooltipHide", function() {
            tooltips && nv.tooltip.cleanup();
        });
        chart.dispatch = dispatch;
        chart.scatter = scatter;
        chart.legend = legend;
        chart.controls = controls;
        chart.xAxis = xAxis;
        chart.yAxis = yAxis;
        chart.distX = distX;
        chart.distY = distY;
        d3.rebind(chart, scatter, "id", "interactive", "pointActive", "x", "y", "shape", "size", "xScale", "yScale", "zScale", "xDomain", "yDomain", "xRange", "yRange", "sizeDomain", "sizeRange", "forceX", "forceY", "forceSize", "clipVoronoi", "clipRadius", "useVoronoi");
        chart.options = nv.utils.optionsFunc.bind(chart);
        chart.margin = function(_) {
            if (!arguments.length) return margin;
            margin.top = "undefined" != typeof _.top ? _.top : margin.top;
            margin.right = "undefined" != typeof _.right ? _.right : margin.right;
            margin.bottom = "undefined" != typeof _.bottom ? _.bottom : margin.bottom;
            margin.left = "undefined" != typeof _.left ? _.left : margin.left;
            return chart;
        };
        chart.width = function(_) {
            if (!arguments.length) return width;
            width = _;
            return chart;
        };
        chart.height = function(_) {
            if (!arguments.length) return height;
            height = _;
            return chart;
        };
        chart.color = function(_) {
            if (!arguments.length) return color;
            color = nv.utils.getColor(_);
            legend.color(color);
            distX.color(color);
            distY.color(color);
            return chart;
        };
        chart.showDistX = function(_) {
            if (!arguments.length) return showDistX;
            showDistX = _;
            return chart;
        };
        chart.showDistY = function(_) {
            if (!arguments.length) return showDistY;
            showDistY = _;
            return chart;
        };
        chart.showControls = function(_) {
            if (!arguments.length) return showControls;
            showControls = _;
            return chart;
        };
        chart.showLegend = function(_) {
            if (!arguments.length) return showLegend;
            showLegend = _;
            return chart;
        };
        chart.showXAxis = function(_) {
            if (!arguments.length) return showXAxis;
            showXAxis = _;
            return chart;
        };
        chart.showYAxis = function(_) {
            if (!arguments.length) return showYAxis;
            showYAxis = _;
            return chart;
        };
        chart.rightAlignYAxis = function(_) {
            if (!arguments.length) return rightAlignYAxis;
            rightAlignYAxis = _;
            yAxis.orient(_ ? "right" : "left");
            return chart;
        };
        chart.fisheye = function(_) {
            if (!arguments.length) return fisheye;
            fisheye = _;
            return chart;
        };
        chart.xPadding = function(_) {
            if (!arguments.length) return xPadding;
            xPadding = _;
            return chart;
        };
        chart.yPadding = function(_) {
            if (!arguments.length) return yPadding;
            yPadding = _;
            return chart;
        };
        chart.tooltips = function(_) {
            if (!arguments.length) return tooltips;
            tooltips = _;
            return chart;
        };
        chart.tooltipContent = function(_) {
            if (!arguments.length) return tooltip;
            tooltip = _;
            return chart;
        };
        chart.tooltipXContent = function(_) {
            if (!arguments.length) return tooltipX;
            tooltipX = _;
            return chart;
        };
        chart.tooltipYContent = function(_) {
            if (!arguments.length) return tooltipY;
            tooltipY = _;
            return chart;
        };
        chart.state = function(_) {
            if (!arguments.length) return state;
            state = _;
            return chart;
        };
        chart.defaultState = function(_) {
            if (!arguments.length) return defaultState;
            defaultState = _;
            return chart;
        };
        chart.noData = function(_) {
            if (!arguments.length) return noData;
            noData = _;
            return chart;
        };
        chart.transitionDuration = function(_) {
            if (!arguments.length) return transitionDuration;
            transitionDuration = _;
            return chart;
        };
        return chart;
    };
    nv.models.scatterPlusLineChart = function() {
        "use strict";
        function chart(selection) {
            selection.each(function(data) {
                function updateFisheye() {
                    if (pauseFisheye) {
                        g.select(".nv-point-paths").style("pointer-events", "all");
                        return false;
                    }
                    g.select(".nv-point-paths").style("pointer-events", "none");
                    var mouse = d3.mouse(this);
                    x.distortion(fisheye).focus(mouse[0]);
                    y.distortion(fisheye).focus(mouse[1]);
                    g.select(".nv-scatterWrap").datum(data.filter(function(d) {
                        return !d.disabled;
                    })).call(scatter);
                    showXAxis && g.select(".nv-x.nv-axis").call(xAxis);
                    showYAxis && g.select(".nv-y.nv-axis").call(yAxis);
                    g.select(".nv-distributionX").datum(data.filter(function(d) {
                        return !d.disabled;
                    })).call(distX);
                    g.select(".nv-distributionY").datum(data.filter(function(d) {
                        return !d.disabled;
                    })).call(distY);
                }
                var container = d3.select(this), that = this;
                var availableWidth = (width || parseInt(container.style("width")) || 960) - margin.left - margin.right, availableHeight = (height || parseInt(container.style("height")) || 400) - margin.top - margin.bottom;
                chart.update = function() {
                    container.transition().duration(transitionDuration).call(chart);
                };
                chart.container = this;
                state.disabled = data.map(function(d) {
                    return !!d.disabled;
                });
                if (!defaultState) {
                    var key;
                    defaultState = {};
                    for (key in state) defaultState[key] = state[key] instanceof Array ? state[key].slice(0) : state[key];
                }
                if (!(data && data.length && data.filter(function(d) {
                    return d.values.length;
                }).length)) {
                    var noDataText = container.selectAll(".nv-noData").data([ noData ]);
                    noDataText.enter().append("text").attr("class", "nvd3 nv-noData").attr("dy", "-.7em").style("text-anchor", "middle");
                    noDataText.attr("x", margin.left + availableWidth / 2).attr("y", margin.top + availableHeight / 2).text(function(d) {
                        return d;
                    });
                    return chart;
                }
                container.selectAll(".nv-noData").remove();
                x = scatter.xScale();
                y = scatter.yScale();
                x0 = x0 || x;
                y0 = y0 || y;
                var wrap = container.selectAll("g.nv-wrap.nv-scatterChart").data([ data ]);
                var wrapEnter = wrap.enter().append("g").attr("class", "nvd3 nv-wrap nv-scatterChart nv-chart-" + scatter.id());
                var gEnter = wrapEnter.append("g");
                var g = wrap.select("g");
                gEnter.append("rect").attr("class", "nvd3 nv-background").style("pointer-events", "none");
                gEnter.append("g").attr("class", "nv-x nv-axis");
                gEnter.append("g").attr("class", "nv-y nv-axis");
                gEnter.append("g").attr("class", "nv-scatterWrap");
                gEnter.append("g").attr("class", "nv-regressionLinesWrap");
                gEnter.append("g").attr("class", "nv-distWrap");
                gEnter.append("g").attr("class", "nv-legendWrap");
                gEnter.append("g").attr("class", "nv-controlsWrap");
                wrap.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                rightAlignYAxis && g.select(".nv-y.nv-axis").attr("transform", "translate(" + availableWidth + ",0)");
                if (showLegend) {
                    legend.width(availableWidth / 2);
                    wrap.select(".nv-legendWrap").datum(data).call(legend);
                    if (margin.top != legend.height()) {
                        margin.top = legend.height();
                        availableHeight = (height || parseInt(container.style("height")) || 400) - margin.top - margin.bottom;
                    }
                    wrap.select(".nv-legendWrap").attr("transform", "translate(" + availableWidth / 2 + "," + -margin.top + ")");
                }
                if (showControls) {
                    controls.width(180).color([ "#444" ]);
                    g.select(".nv-controlsWrap").datum(controlsData).attr("transform", "translate(0," + -margin.top + ")").call(controls);
                }
                scatter.width(availableWidth).height(availableHeight).color(data.map(function(d, i) {
                    return d.color || color(d, i);
                }).filter(function(d, i) {
                    return !data[i].disabled;
                }));
                wrap.select(".nv-scatterWrap").datum(data.filter(function(d) {
                    return !d.disabled;
                })).call(scatter);
                wrap.select(".nv-regressionLinesWrap").attr("clip-path", "url(#nv-edge-clip-" + scatter.id() + ")");
                var regWrap = wrap.select(".nv-regressionLinesWrap").selectAll(".nv-regLines").data(function(d) {
                    return d;
                });
                regWrap.enter().append("g").attr("class", "nv-regLines");
                var regLine = regWrap.selectAll(".nv-regLine").data(function(d) {
                    return [ d ];
                });
                regLine.enter().append("line").attr("class", "nv-regLine").style("stroke-opacity", 0);
                regLine.transition().attr("x1", x.range()[0]).attr("x2", x.range()[1]).attr("y1", function(d) {
                    return y(x.domain()[0] * d.slope + d.intercept);
                }).attr("y2", function(d) {
                    return y(x.domain()[1] * d.slope + d.intercept);
                }).style("stroke", function(d, i, j) {
                    return color(d, j);
                }).style("stroke-opacity", function(d) {
                    return d.disabled || "undefined" == typeof d.slope || "undefined" == typeof d.intercept ? 0 : 1;
                });
                if (showXAxis) {
                    xAxis.scale(x).ticks(xAxis.ticks() ? xAxis.ticks() : availableWidth / 100).tickSize(-availableHeight, 0);
                    g.select(".nv-x.nv-axis").attr("transform", "translate(0," + y.range()[0] + ")").call(xAxis);
                }
                if (showYAxis) {
                    yAxis.scale(y).ticks(yAxis.ticks() ? yAxis.ticks() : availableHeight / 36).tickSize(-availableWidth, 0);
                    g.select(".nv-y.nv-axis").call(yAxis);
                }
                if (showDistX) {
                    distX.getData(scatter.x()).scale(x).width(availableWidth).color(data.map(function(d, i) {
                        return d.color || color(d, i);
                    }).filter(function(d, i) {
                        return !data[i].disabled;
                    }));
                    gEnter.select(".nv-distWrap").append("g").attr("class", "nv-distributionX");
                    g.select(".nv-distributionX").attr("transform", "translate(0," + y.range()[0] + ")").datum(data.filter(function(d) {
                        return !d.disabled;
                    })).call(distX);
                }
                if (showDistY) {
                    distY.getData(scatter.y()).scale(y).width(availableHeight).color(data.map(function(d, i) {
                        return d.color || color(d, i);
                    }).filter(function(d, i) {
                        return !data[i].disabled;
                    }));
                    gEnter.select(".nv-distWrap").append("g").attr("class", "nv-distributionY");
                    g.select(".nv-distributionY").attr("transform", "translate(" + (rightAlignYAxis ? availableWidth : -distY.size()) + ",0)").datum(data.filter(function(d) {
                        return !d.disabled;
                    })).call(distY);
                }
                if (d3.fisheye) {
                    g.select(".nv-background").attr("width", availableWidth).attr("height", availableHeight);
                    g.select(".nv-background").on("mousemove", updateFisheye);
                    g.select(".nv-background").on("click", function() {
                        pauseFisheye = !pauseFisheye;
                    });
                    scatter.dispatch.on("elementClick.freezeFisheye", function() {
                        pauseFisheye = !pauseFisheye;
                    });
                }
                controls.dispatch.on("legendClick", function(d) {
                    d.disabled = !d.disabled;
                    fisheye = d.disabled ? 0 : 2.5;
                    g.select(".nv-background").style("pointer-events", d.disabled ? "none" : "all");
                    g.select(".nv-point-paths").style("pointer-events", d.disabled ? "all" : "none");
                    if (d.disabled) {
                        x.distortion(fisheye).focus(0);
                        y.distortion(fisheye).focus(0);
                        g.select(".nv-scatterWrap").call(scatter);
                        g.select(".nv-x.nv-axis").call(xAxis);
                        g.select(".nv-y.nv-axis").call(yAxis);
                    } else pauseFisheye = false;
                    chart.update();
                });
                legend.dispatch.on("stateChange", function(newState) {
                    state = newState;
                    dispatch.stateChange(state);
                    chart.update();
                });
                scatter.dispatch.on("elementMouseover.tooltip", function(e) {
                    d3.select(".nv-chart-" + scatter.id() + " .nv-series-" + e.seriesIndex + " .nv-distx-" + e.pointIndex).attr("y1", e.pos[1] - availableHeight);
                    d3.select(".nv-chart-" + scatter.id() + " .nv-series-" + e.seriesIndex + " .nv-disty-" + e.pointIndex).attr("x2", e.pos[0] + distX.size());
                    e.pos = [ e.pos[0] + margin.left, e.pos[1] + margin.top ];
                    dispatch.tooltipShow(e);
                });
                dispatch.on("tooltipShow", function(e) {
                    tooltips && showTooltip(e, that.parentNode);
                });
                dispatch.on("changeState", function(e) {
                    if ("undefined" != typeof e.disabled) {
                        data.forEach(function(series, i) {
                            series.disabled = e.disabled[i];
                        });
                        state.disabled = e.disabled;
                    }
                    chart.update();
                });
                x0 = x.copy();
                y0 = y.copy();
            });
            return chart;
        }
        var scatter = nv.models.scatter(), xAxis = nv.models.axis(), yAxis = nv.models.axis(), legend = nv.models.legend(), controls = nv.models.legend(), distX = nv.models.distribution(), distY = nv.models.distribution();
        var margin = {
            top: 30,
            right: 20,
            bottom: 50,
            left: 75
        }, width = null, height = null, color = nv.utils.defaultColor(), x = d3.fisheye ? d3.fisheye.scale(d3.scale.linear).distortion(0) : scatter.xScale(), y = d3.fisheye ? d3.fisheye.scale(d3.scale.linear).distortion(0) : scatter.yScale(), showDistX = false, showDistY = false, showLegend = true, showXAxis = true, showYAxis = true, rightAlignYAxis = false, showControls = !!d3.fisheye, fisheye = 0, pauseFisheye = false, tooltips = true, tooltipX = function(key, x) {
            return "<strong>" + x + "</strong>";
        }, tooltipY = function(key, x, y) {
            return "<strong>" + y + "</strong>";
        }, tooltip = function(key, x, y, date) {
            return "<h3>" + key + "</h3>" + "<p>" + date + "</p>";
        }, state = {}, defaultState = null, dispatch = d3.dispatch("tooltipShow", "tooltipHide", "stateChange", "changeState"), noData = "No Data Available.", transitionDuration = 250;
        scatter.xScale(x).yScale(y);
        xAxis.orient("bottom").tickPadding(10);
        yAxis.orient(rightAlignYAxis ? "right" : "left").tickPadding(10);
        distX.axis("x");
        distY.axis("y");
        controls.updateState(false);
        var x0, y0;
        var showTooltip = function(e, offsetElement) {
            var left = e.pos[0] + (offsetElement.offsetLeft || 0), top = e.pos[1] + (offsetElement.offsetTop || 0), leftX = e.pos[0] + (offsetElement.offsetLeft || 0), topX = y.range()[0] + margin.top + (offsetElement.offsetTop || 0), leftY = x.range()[0] + margin.left + (offsetElement.offsetLeft || 0), topY = e.pos[1] + (offsetElement.offsetTop || 0), xVal = xAxis.tickFormat()(scatter.x()(e.point, e.pointIndex)), yVal = yAxis.tickFormat()(scatter.y()(e.point, e.pointIndex));
            null != tooltipX && nv.tooltip.show([ leftX, topX ], tooltipX(e.series.key, xVal, yVal, e, chart), "n", 1, offsetElement, "x-nvtooltip");
            null != tooltipY && nv.tooltip.show([ leftY, topY ], tooltipY(e.series.key, xVal, yVal, e, chart), "e", 1, offsetElement, "y-nvtooltip");
            null != tooltip && nv.tooltip.show([ left, top ], tooltip(e.series.key, xVal, yVal, e.point.tooltip, e, chart), 0 > e.value ? "n" : "s", null, offsetElement);
        };
        var controlsData = [ {
            key: "Magnify",
            disabled: true
        } ];
        scatter.dispatch.on("elementMouseout.tooltip", function(e) {
            dispatch.tooltipHide(e);
            d3.select(".nv-chart-" + scatter.id() + " .nv-series-" + e.seriesIndex + " .nv-distx-" + e.pointIndex).attr("y1", 0);
            d3.select(".nv-chart-" + scatter.id() + " .nv-series-" + e.seriesIndex + " .nv-disty-" + e.pointIndex).attr("x2", distY.size());
        });
        dispatch.on("tooltipHide", function() {
            tooltips && nv.tooltip.cleanup();
        });
        chart.dispatch = dispatch;
        chart.scatter = scatter;
        chart.legend = legend;
        chart.controls = controls;
        chart.xAxis = xAxis;
        chart.yAxis = yAxis;
        chart.distX = distX;
        chart.distY = distY;
        d3.rebind(chart, scatter, "id", "interactive", "pointActive", "x", "y", "shape", "size", "xScale", "yScale", "zScale", "xDomain", "yDomain", "xRange", "yRange", "sizeDomain", "sizeRange", "forceX", "forceY", "forceSize", "clipVoronoi", "clipRadius", "useVoronoi");
        chart.options = nv.utils.optionsFunc.bind(chart);
        chart.margin = function(_) {
            if (!arguments.length) return margin;
            margin.top = "undefined" != typeof _.top ? _.top : margin.top;
            margin.right = "undefined" != typeof _.right ? _.right : margin.right;
            margin.bottom = "undefined" != typeof _.bottom ? _.bottom : margin.bottom;
            margin.left = "undefined" != typeof _.left ? _.left : margin.left;
            return chart;
        };
        chart.width = function(_) {
            if (!arguments.length) return width;
            width = _;
            return chart;
        };
        chart.height = function(_) {
            if (!arguments.length) return height;
            height = _;
            return chart;
        };
        chart.color = function(_) {
            if (!arguments.length) return color;
            color = nv.utils.getColor(_);
            legend.color(color);
            distX.color(color);
            distY.color(color);
            return chart;
        };
        chart.showDistX = function(_) {
            if (!arguments.length) return showDistX;
            showDistX = _;
            return chart;
        };
        chart.showDistY = function(_) {
            if (!arguments.length) return showDistY;
            showDistY = _;
            return chart;
        };
        chart.showControls = function(_) {
            if (!arguments.length) return showControls;
            showControls = _;
            return chart;
        };
        chart.showLegend = function(_) {
            if (!arguments.length) return showLegend;
            showLegend = _;
            return chart;
        };
        chart.showXAxis = function(_) {
            if (!arguments.length) return showXAxis;
            showXAxis = _;
            return chart;
        };
        chart.showYAxis = function(_) {
            if (!arguments.length) return showYAxis;
            showYAxis = _;
            return chart;
        };
        chart.rightAlignYAxis = function(_) {
            if (!arguments.length) return rightAlignYAxis;
            rightAlignYAxis = _;
            yAxis.orient(_ ? "right" : "left");
            return chart;
        };
        chart.fisheye = function(_) {
            if (!arguments.length) return fisheye;
            fisheye = _;
            return chart;
        };
        chart.tooltips = function(_) {
            if (!arguments.length) return tooltips;
            tooltips = _;
            return chart;
        };
        chart.tooltipContent = function(_) {
            if (!arguments.length) return tooltip;
            tooltip = _;
            return chart;
        };
        chart.tooltipXContent = function(_) {
            if (!arguments.length) return tooltipX;
            tooltipX = _;
            return chart;
        };
        chart.tooltipYContent = function(_) {
            if (!arguments.length) return tooltipY;
            tooltipY = _;
            return chart;
        };
        chart.state = function(_) {
            if (!arguments.length) return state;
            state = _;
            return chart;
        };
        chart.defaultState = function(_) {
            if (!arguments.length) return defaultState;
            defaultState = _;
            return chart;
        };
        chart.noData = function(_) {
            if (!arguments.length) return noData;
            noData = _;
            return chart;
        };
        chart.transitionDuration = function(_) {
            if (!arguments.length) return transitionDuration;
            transitionDuration = _;
            return chart;
        };
        return chart;
    };
    nv.models.sparkline = function() {
        "use strict";
        function chart(selection) {
            selection.each(function(data) {
                var availableWidth = width - margin.left - margin.right, availableHeight = height - margin.top - margin.bottom, container = d3.select(this);
                x.domain(xDomain || d3.extent(data, getX)).range(xRange || [ 0, availableWidth ]);
                y.domain(yDomain || d3.extent(data, getY)).range(yRange || [ availableHeight, 0 ]);
                var wrap = container.selectAll("g.nv-wrap.nv-sparkline").data([ data ]);
                var wrapEnter = wrap.enter().append("g").attr("class", "nvd3 nv-wrap nv-sparkline");
                wrapEnter.append("g");
                wrap.select("g");
                wrap.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                var paths = wrap.selectAll("path").data(function(d) {
                    return [ d ];
                });
                paths.enter().append("path");
                paths.exit().remove();
                paths.style("stroke", function(d, i) {
                    return d.color || color(d, i);
                }).attr("d", d3.svg.line().x(function(d, i) {
                    return x(getX(d, i));
                }).y(function(d, i) {
                    return y(getY(d, i));
                }));
                var points = wrap.selectAll("circle.nv-point").data(function(data) {
                    function pointIndex(index) {
                        if (-1 != index) {
                            var result = data[index];
                            result.pointIndex = index;
                            return result;
                        }
                        return null;
                    }
                    var yValues = data.map(function(d, i) {
                        return getY(d, i);
                    });
                    var maxPoint = pointIndex(yValues.lastIndexOf(y.domain()[1])), minPoint = pointIndex(yValues.indexOf(y.domain()[0])), currentPoint = pointIndex(yValues.length - 1);
                    return [ minPoint, maxPoint, currentPoint ].filter(function(d) {
                        return null != d;
                    });
                });
                points.enter().append("circle");
                points.exit().remove();
                points.attr("cx", function(d) {
                    return x(getX(d, d.pointIndex));
                }).attr("cy", function(d) {
                    return y(getY(d, d.pointIndex));
                }).attr("r", 2).attr("class", function(d) {
                    return getX(d, d.pointIndex) == x.domain()[1] ? "nv-point nv-currentValue" : getY(d, d.pointIndex) == y.domain()[0] ? "nv-point nv-minValue" : "nv-point nv-maxValue";
                });
            });
            return chart;
        }
        var xDomain, yDomain, xRange, yRange, margin = {
            top: 2,
            right: 0,
            bottom: 2,
            left: 0
        }, width = 400, height = 32, animate = true, x = d3.scale.linear(), y = d3.scale.linear(), getX = function(d) {
            return d.x;
        }, getY = function(d) {
            return d.y;
        }, color = nv.utils.getColor([ "#000" ]);
        chart.options = nv.utils.optionsFunc.bind(chart);
        chart.margin = function(_) {
            if (!arguments.length) return margin;
            margin.top = "undefined" != typeof _.top ? _.top : margin.top;
            margin.right = "undefined" != typeof _.right ? _.right : margin.right;
            margin.bottom = "undefined" != typeof _.bottom ? _.bottom : margin.bottom;
            margin.left = "undefined" != typeof _.left ? _.left : margin.left;
            return chart;
        };
        chart.width = function(_) {
            if (!arguments.length) return width;
            width = _;
            return chart;
        };
        chart.height = function(_) {
            if (!arguments.length) return height;
            height = _;
            return chart;
        };
        chart.x = function(_) {
            if (!arguments.length) return getX;
            getX = d3.functor(_);
            return chart;
        };
        chart.y = function(_) {
            if (!arguments.length) return getY;
            getY = d3.functor(_);
            return chart;
        };
        chart.xScale = function(_) {
            if (!arguments.length) return x;
            x = _;
            return chart;
        };
        chart.yScale = function(_) {
            if (!arguments.length) return y;
            y = _;
            return chart;
        };
        chart.xDomain = function(_) {
            if (!arguments.length) return xDomain;
            xDomain = _;
            return chart;
        };
        chart.yDomain = function(_) {
            if (!arguments.length) return yDomain;
            yDomain = _;
            return chart;
        };
        chart.xRange = function(_) {
            if (!arguments.length) return xRange;
            xRange = _;
            return chart;
        };
        chart.yRange = function(_) {
            if (!arguments.length) return yRange;
            yRange = _;
            return chart;
        };
        chart.animate = function(_) {
            if (!arguments.length) return animate;
            animate = _;
            return chart;
        };
        chart.color = function(_) {
            if (!arguments.length) return color;
            color = nv.utils.getColor(_);
            return chart;
        };
        return chart;
    };
    nv.models.sparklinePlus = function() {
        "use strict";
        function chart(selection) {
            selection.each(function(data) {
                function updateValueLine() {
                    if (paused) return;
                    var hoverValue = g.selectAll(".nv-hoverValue").data(index);
                    var hoverEnter = hoverValue.enter().append("g").attr("class", "nv-hoverValue").style("stroke-opacity", 0).style("fill-opacity", 0);
                    hoverValue.exit().transition().duration(250).style("stroke-opacity", 0).style("fill-opacity", 0).remove();
                    hoverValue.attr("transform", function(d) {
                        return "translate(" + x(sparkline.x()(data[d], d)) + ",0)";
                    }).transition().duration(250).style("stroke-opacity", 1).style("fill-opacity", 1);
                    if (!index.length) return;
                    hoverEnter.append("line").attr("x1", 0).attr("y1", -margin.top).attr("x2", 0).attr("y2", availableHeight);
                    hoverEnter.append("text").attr("class", "nv-xValue").attr("x", -6).attr("y", -margin.top).attr("text-anchor", "end").attr("dy", ".9em");
                    g.select(".nv-hoverValue .nv-xValue").text(xTickFormat(sparkline.x()(data[index[0]], index[0])));
                    hoverEnter.append("text").attr("class", "nv-yValue").attr("x", 6).attr("y", -margin.top).attr("text-anchor", "start").attr("dy", ".9em");
                    g.select(".nv-hoverValue .nv-yValue").text(yTickFormat(sparkline.y()(data[index[0]], index[0])));
                }
                function sparklineHover() {
                    function getClosestIndex(data, x) {
                        var distance = Math.abs(sparkline.x()(data[0], 0) - x);
                        var closestIndex = 0;
                        for (var i = 0; data.length > i; i++) if (distance > Math.abs(sparkline.x()(data[i], i) - x)) {
                            distance = Math.abs(sparkline.x()(data[i], i) - x);
                            closestIndex = i;
                        }
                        return closestIndex;
                    }
                    if (paused) return;
                    var pos = d3.mouse(this)[0] - margin.left;
                    index = [ getClosestIndex(data, Math.round(x.invert(pos))) ];
                    updateValueLine();
                }
                var container = d3.select(this);
                var availableWidth = (width || parseInt(container.style("width")) || 960) - margin.left - margin.right, availableHeight = (height || parseInt(container.style("height")) || 400) - margin.top - margin.bottom;
                chart.update = function() {
                    chart(selection);
                };
                chart.container = this;
                if (!data || !data.length) {
                    var noDataText = container.selectAll(".nv-noData").data([ noData ]);
                    noDataText.enter().append("text").attr("class", "nvd3 nv-noData").attr("dy", "-.7em").style("text-anchor", "middle");
                    noDataText.attr("x", margin.left + availableWidth / 2).attr("y", margin.top + availableHeight / 2).text(function(d) {
                        return d;
                    });
                    return chart;
                }
                container.selectAll(".nv-noData").remove();
                var currentValue = sparkline.y()(data[data.length - 1], data.length - 1);
                x = sparkline.xScale();
                y = sparkline.yScale();
                var wrap = container.selectAll("g.nv-wrap.nv-sparklineplus").data([ data ]);
                var wrapEnter = wrap.enter().append("g").attr("class", "nvd3 nv-wrap nv-sparklineplus");
                var gEnter = wrapEnter.append("g");
                var g = wrap.select("g");
                gEnter.append("g").attr("class", "nv-sparklineWrap");
                gEnter.append("g").attr("class", "nv-valueWrap");
                gEnter.append("g").attr("class", "nv-hoverArea");
                wrap.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                var sparklineWrap = g.select(".nv-sparklineWrap");
                sparkline.width(availableWidth).height(availableHeight);
                sparklineWrap.call(sparkline);
                var valueWrap = g.select(".nv-valueWrap");
                var value = valueWrap.selectAll(".nv-currentValue").data([ currentValue ]);
                value.enter().append("text").attr("class", "nv-currentValue").attr("dx", rightAlignValue ? -8 : 8).attr("dy", ".9em").style("text-anchor", rightAlignValue ? "end" : "start");
                value.attr("x", availableWidth + (rightAlignValue ? margin.right : 0)).attr("y", alignValue ? function(d) {
                    return y(d);
                } : 0).style("fill", sparkline.color()(data[data.length - 1], data.length - 1)).text(yTickFormat(currentValue));
                gEnter.select(".nv-hoverArea").append("rect").on("mousemove", sparklineHover).on("click", function() {
                    paused = !paused;
                }).on("mouseout", function() {
                    index = [];
                    updateValueLine();
                });
                g.select(".nv-hoverArea rect").attr("transform", function() {
                    return "translate(" + -margin.left + "," + -margin.top + ")";
                }).attr("width", availableWidth + margin.left + margin.right).attr("height", availableHeight + margin.top);
            });
            return chart;
        }
        var sparkline = nv.models.sparkline();
        var x, y, margin = {
            top: 15,
            right: 100,
            bottom: 10,
            left: 50
        }, width = null, height = null, index = [], paused = false, xTickFormat = d3.format(",r"), yTickFormat = d3.format(",.2f"), showValue = true, alignValue = true, rightAlignValue = false, noData = "No Data Available.";
        chart.sparkline = sparkline;
        d3.rebind(chart, sparkline, "x", "y", "xScale", "yScale", "color");
        chart.options = nv.utils.optionsFunc.bind(chart);
        chart.margin = function(_) {
            if (!arguments.length) return margin;
            margin.top = "undefined" != typeof _.top ? _.top : margin.top;
            margin.right = "undefined" != typeof _.right ? _.right : margin.right;
            margin.bottom = "undefined" != typeof _.bottom ? _.bottom : margin.bottom;
            margin.left = "undefined" != typeof _.left ? _.left : margin.left;
            return chart;
        };
        chart.width = function(_) {
            if (!arguments.length) return width;
            width = _;
            return chart;
        };
        chart.height = function(_) {
            if (!arguments.length) return height;
            height = _;
            return chart;
        };
        chart.xTickFormat = function(_) {
            if (!arguments.length) return xTickFormat;
            xTickFormat = _;
            return chart;
        };
        chart.yTickFormat = function(_) {
            if (!arguments.length) return yTickFormat;
            yTickFormat = _;
            return chart;
        };
        chart.showValue = function(_) {
            if (!arguments.length) return showValue;
            showValue = _;
            return chart;
        };
        chart.alignValue = function(_) {
            if (!arguments.length) return alignValue;
            alignValue = _;
            return chart;
        };
        chart.rightAlignValue = function(_) {
            if (!arguments.length) return rightAlignValue;
            rightAlignValue = _;
            return chart;
        };
        chart.noData = function(_) {
            if (!arguments.length) return noData;
            noData = _;
            return chart;
        };
        return chart;
    };
    nv.models.stackedArea = function() {
        "use strict";
        function chart(selection) {
            selection.each(function(data) {
                var availableWidth = width - margin.left - margin.right, availableHeight = height - margin.top - margin.bottom, container = d3.select(this);
                x = scatter.xScale();
                y = scatter.yScale();
                var dataRaw = data;
                data.forEach(function(aseries, i) {
                    aseries.seriesIndex = i;
                    aseries.values = aseries.values.map(function(d, j) {
                        d.index = j;
                        d.seriesIndex = i;
                        return d;
                    });
                });
                var dataFiltered = data.filter(function(series) {
                    return !series.disabled;
                });
                data = d3.layout.stack().order(order).offset(offset).values(function(d) {
                    return d.values;
                }).x(getX).y(getY).out(function(d, y0, y) {
                    var yHeight = 0 === getY(d) ? 0 : y;
                    d.display = {
                        y: yHeight,
                        y0: y0
                    };
                })(dataFiltered);
                var wrap = container.selectAll("g.nv-wrap.nv-stackedarea").data([ data ]);
                var wrapEnter = wrap.enter().append("g").attr("class", "nvd3 nv-wrap nv-stackedarea");
                var defsEnter = wrapEnter.append("defs");
                var gEnter = wrapEnter.append("g");
                var g = wrap.select("g");
                gEnter.append("g").attr("class", "nv-areaWrap");
                gEnter.append("g").attr("class", "nv-scatterWrap");
                wrap.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                scatter.width(availableWidth).height(availableHeight).x(getX).y(function(d) {
                    return d.display.y + d.display.y0;
                }).forceY([ 0 ]).color(data.map(function(d) {
                    return d.color || color(d, d.seriesIndex);
                }));
                var scatterWrap = g.select(".nv-scatterWrap").datum(data);
                scatterWrap.call(scatter);
                defsEnter.append("clipPath").attr("id", "nv-edge-clip-" + id).append("rect");
                wrap.select("#nv-edge-clip-" + id + " rect").attr("width", availableWidth).attr("height", availableHeight);
                g.attr("clip-path", clipEdge ? "url(#nv-edge-clip-" + id + ")" : "");
                var area = d3.svg.area().x(function(d, i) {
                    return x(getX(d, i));
                }).y0(function(d) {
                    return y(d.display.y0);
                }).y1(function(d) {
                    return y(d.display.y + d.display.y0);
                }).interpolate(interpolate);
                var zeroArea = d3.svg.area().x(function(d, i) {
                    return x(getX(d, i));
                }).y0(function(d) {
                    return y(d.display.y0);
                }).y1(function(d) {
                    return y(d.display.y0);
                });
                var path = g.select(".nv-areaWrap").selectAll("path.nv-area").data(function(d) {
                    return d;
                });
                path.enter().append("path").attr("class", function(d, i) {
                    return "nv-area nv-area-" + i;
                }).attr("d", function(d) {
                    return zeroArea(d.values, d.seriesIndex);
                }).on("mouseover", function(d) {
                    d3.select(this).classed("hover", true);
                    dispatch.areaMouseover({
                        point: d,
                        series: d.key,
                        pos: [ d3.event.pageX, d3.event.pageY ],
                        seriesIndex: d.seriesIndex
                    });
                }).on("mouseout", function(d) {
                    d3.select(this).classed("hover", false);
                    dispatch.areaMouseout({
                        point: d,
                        series: d.key,
                        pos: [ d3.event.pageX, d3.event.pageY ],
                        seriesIndex: d.seriesIndex
                    });
                }).on("click", function(d) {
                    d3.select(this).classed("hover", false);
                    dispatch.areaClick({
                        point: d,
                        series: d.key,
                        pos: [ d3.event.pageX, d3.event.pageY ],
                        seriesIndex: d.seriesIndex
                    });
                });
                path.exit().remove();
                path.style("fill", function(d) {
                    return d.color || color(d, d.seriesIndex);
                }).style("stroke", function(d) {
                    return d.color || color(d, d.seriesIndex);
                });
                path.transition().attr("d", function(d, i) {
                    return area(d.values, i);
                });
                scatter.dispatch.on("elementMouseover.area", function(e) {
                    g.select(".nv-chart-" + id + " .nv-area-" + e.seriesIndex).classed("hover", true);
                });
                scatter.dispatch.on("elementMouseout.area", function(e) {
                    g.select(".nv-chart-" + id + " .nv-area-" + e.seriesIndex).classed("hover", false);
                });
                chart.d3_stackedOffset_stackPercent = function(stackData) {
                    var i, j, o, n = stackData.length, m = stackData[0].length, k = 1 / n, y0 = [];
                    for (j = 0; m > j; ++j) {
                        for (i = 0, o = 0; dataRaw.length > i; i++) o += getY(dataRaw[i].values[j]);
                        if (o) for (i = 0; n > i; i++) stackData[i][j][1] /= o; else for (i = 0; n > i; i++) stackData[i][j][1] = k;
                    }
                    for (j = 0; m > j; ++j) y0[j] = 0;
                    return y0;
                };
            });
            return chart;
        }
        var x, y, margin = {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        }, width = 960, height = 500, color = nv.utils.defaultColor(), id = Math.floor(1e5 * Math.random()), getX = function(d) {
            return d.x;
        }, getY = function(d) {
            return d.y;
        }, style = "stack", offset = "zero", order = "default", interpolate = "linear", clipEdge = false, scatter = nv.models.scatter(), dispatch = d3.dispatch("tooltipShow", "tooltipHide", "areaClick", "areaMouseover", "areaMouseout");
        scatter.size(2.2).sizeDomain([ 2.2, 2.2 ]);
        scatter.dispatch.on("elementClick.area", function(e) {
            dispatch.areaClick(e);
        });
        scatter.dispatch.on("elementMouseover.tooltip", function(e) {
            e.pos = [ e.pos[0] + margin.left, e.pos[1] + margin.top ], dispatch.tooltipShow(e);
        });
        scatter.dispatch.on("elementMouseout.tooltip", function(e) {
            dispatch.tooltipHide(e);
        });
        chart.dispatch = dispatch;
        chart.scatter = scatter;
        d3.rebind(chart, scatter, "interactive", "size", "xScale", "yScale", "zScale", "xDomain", "yDomain", "xRange", "yRange", "sizeDomain", "forceX", "forceY", "forceSize", "clipVoronoi", "useVoronoi", "clipRadius", "highlightPoint", "clearHighlights");
        chart.options = nv.utils.optionsFunc.bind(chart);
        chart.x = function(_) {
            if (!arguments.length) return getX;
            getX = d3.functor(_);
            return chart;
        };
        chart.y = function(_) {
            if (!arguments.length) return getY;
            getY = d3.functor(_);
            return chart;
        };
        chart.margin = function(_) {
            if (!arguments.length) return margin;
            margin.top = "undefined" != typeof _.top ? _.top : margin.top;
            margin.right = "undefined" != typeof _.right ? _.right : margin.right;
            margin.bottom = "undefined" != typeof _.bottom ? _.bottom : margin.bottom;
            margin.left = "undefined" != typeof _.left ? _.left : margin.left;
            return chart;
        };
        chart.width = function(_) {
            if (!arguments.length) return width;
            width = _;
            return chart;
        };
        chart.height = function(_) {
            if (!arguments.length) return height;
            height = _;
            return chart;
        };
        chart.clipEdge = function(_) {
            if (!arguments.length) return clipEdge;
            clipEdge = _;
            return chart;
        };
        chart.color = function(_) {
            if (!arguments.length) return color;
            color = nv.utils.getColor(_);
            return chart;
        };
        chart.offset = function(_) {
            if (!arguments.length) return offset;
            offset = _;
            return chart;
        };
        chart.order = function(_) {
            if (!arguments.length) return order;
            order = _;
            return chart;
        };
        chart.style = function(_) {
            if (!arguments.length) return style;
            style = _;
            switch (style) {
              case "stack":
                chart.offset("zero");
                chart.order("default");
                break;

              case "stream":
                chart.offset("wiggle");
                chart.order("inside-out");
                break;

              case "stream-center":
                chart.offset("silhouette");
                chart.order("inside-out");
                break;

              case "expand":
                chart.offset("expand");
                chart.order("default");
                break;

              case "stack_percent":
                chart.offset(chart.d3_stackedOffset_stackPercent);
                chart.order("default");
            }
            return chart;
        };
        chart.interpolate = function(_) {
            if (!arguments.length) return interpolate;
            interpolate = _;
            return chart;
        };
        return chart;
    };
    nv.models.stackedAreaChart = function() {
        "use strict";
        function chart(selection) {
            selection.each(function(data) {
                var container = d3.select(this), that = this;
                var availableWidth = (width || parseInt(container.style("width")) || 960) - margin.left - margin.right, availableHeight = (height || parseInt(container.style("height")) || 400) - margin.top - margin.bottom;
                chart.update = function() {
                    container.transition().duration(transitionDuration).call(chart);
                };
                chart.container = this;
                state.disabled = data.map(function(d) {
                    return !!d.disabled;
                });
                if (!defaultState) {
                    var key;
                    defaultState = {};
                    for (key in state) defaultState[key] = state[key] instanceof Array ? state[key].slice(0) : state[key];
                }
                if (!(data && data.length && data.filter(function(d) {
                    return d.values.length;
                }).length)) {
                    var noDataText = container.selectAll(".nv-noData").data([ noData ]);
                    noDataText.enter().append("text").attr("class", "nvd3 nv-noData").attr("dy", "-.7em").style("text-anchor", "middle");
                    noDataText.attr("x", margin.left + availableWidth / 2).attr("y", margin.top + availableHeight / 2).text(function(d) {
                        return d;
                    });
                    return chart;
                }
                container.selectAll(".nv-noData").remove();
                x = stacked.xScale();
                y = stacked.yScale();
                var wrap = container.selectAll("g.nv-wrap.nv-stackedAreaChart").data([ data ]);
                var gEnter = wrap.enter().append("g").attr("class", "nvd3 nv-wrap nv-stackedAreaChart").append("g");
                var g = wrap.select("g");
                gEnter.append("rect").style("opacity", 0);
                gEnter.append("g").attr("class", "nv-x nv-axis");
                gEnter.append("g").attr("class", "nv-y nv-axis");
                gEnter.append("g").attr("class", "nv-stackedWrap");
                gEnter.append("g").attr("class", "nv-legendWrap");
                gEnter.append("g").attr("class", "nv-controlsWrap");
                gEnter.append("g").attr("class", "nv-interactive");
                g.select("rect").attr("width", availableWidth).attr("height", availableHeight);
                if (showLegend) {
                    var legendWidth = showControls ? availableWidth - controlWidth : availableWidth;
                    legend.width(legendWidth);
                    g.select(".nv-legendWrap").datum(data).call(legend);
                    if (margin.top != legend.height()) {
                        margin.top = legend.height();
                        availableHeight = (height || parseInt(container.style("height")) || 400) - margin.top - margin.bottom;
                    }
                    g.select(".nv-legendWrap").attr("transform", "translate(" + (availableWidth - legendWidth) + "," + -margin.top + ")");
                }
                if (showControls) {
                    var controlsData = [ {
                        key: controlLabels.stacked || "Stacked",
                        metaKey: "Stacked",
                        disabled: "stack" != stacked.style(),
                        style: "stack"
                    }, {
                        key: controlLabels.stream || "Stream",
                        metaKey: "Stream",
                        disabled: "stream" != stacked.style(),
                        style: "stream"
                    }, {
                        key: controlLabels.expanded || "Expanded",
                        metaKey: "Expanded",
                        disabled: "expand" != stacked.style(),
                        style: "expand"
                    }, {
                        key: controlLabels.stack_percent || "Stack %",
                        metaKey: "Stack_Percent",
                        disabled: "stack_percent" != stacked.style(),
                        style: "stack_percent"
                    } ];
                    controlWidth = 260 * (cData.length / 3);
                    controlsData = controlsData.filter(function(d) {
                        return -1 !== cData.indexOf(d.metaKey);
                    });
                    controls.width(controlWidth).color([ "#444", "#444", "#444" ]);
                    g.select(".nv-controlsWrap").datum(controlsData).call(controls);
                    if (margin.top != Math.max(controls.height(), legend.height())) {
                        margin.top = Math.max(controls.height(), legend.height());
                        availableHeight = (height || parseInt(container.style("height")) || 400) - margin.top - margin.bottom;
                    }
                    g.select(".nv-controlsWrap").attr("transform", "translate(0," + -margin.top + ")");
                }
                wrap.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                rightAlignYAxis && g.select(".nv-y.nv-axis").attr("transform", "translate(" + availableWidth + ",0)");
                if (useInteractiveGuideline) {
                    interactiveLayer.width(availableWidth).height(availableHeight).margin({
                        left: margin.left,
                        top: margin.top
                    }).svgContainer(container).xScale(x);
                    wrap.select(".nv-interactive").call(interactiveLayer);
                }
                stacked.width(availableWidth).height(availableHeight);
                var stackedWrap = g.select(".nv-stackedWrap").datum(data);
                stackedWrap.transition().call(stacked);
                if (showXAxis) {
                    xAxis.scale(x).ticks(availableWidth / 100).tickSize(-availableHeight, 0);
                    g.select(".nv-x.nv-axis").attr("transform", "translate(0," + availableHeight + ")");
                    g.select(".nv-x.nv-axis").transition().duration(0).call(xAxis);
                }
                if (showYAxis) {
                    yAxis.scale(y).ticks("wiggle" == stacked.offset() ? 0 : availableHeight / 36).tickSize(-availableWidth, 0).setTickFormat("expand" == stacked.style() || "stack_percent" == stacked.style() ? d3.format("%") : yAxisTickFormat);
                    g.select(".nv-y.nv-axis").transition().duration(0).call(yAxis);
                }
                stacked.dispatch.on("areaClick.toggle", function(e) {
                    1 === data.filter(function(d) {
                        return !d.disabled;
                    }).length ? data.forEach(function(d) {
                        d.disabled = false;
                    }) : data.forEach(function(d, i) {
                        d.disabled = i != e.seriesIndex;
                    });
                    state.disabled = data.map(function(d) {
                        return !!d.disabled;
                    });
                    dispatch.stateChange(state);
                    chart.update();
                });
                legend.dispatch.on("stateChange", function(newState) {
                    state.disabled = newState.disabled;
                    dispatch.stateChange(state);
                    chart.update();
                });
                controls.dispatch.on("legendClick", function(d) {
                    if (!d.disabled) return;
                    controlsData = controlsData.map(function(s) {
                        s.disabled = true;
                        return s;
                    });
                    d.disabled = false;
                    stacked.style(d.style);
                    state.style = stacked.style();
                    dispatch.stateChange(state);
                    chart.update();
                });
                interactiveLayer.dispatch.on("elementMousemove", function(e) {
                    stacked.clearHighlights();
                    var singlePoint, pointIndex, pointXLocation, allData = [];
                    data.filter(function(series, i) {
                        series.seriesIndex = i;
                        return !series.disabled;
                    }).forEach(function(series, i) {
                        pointIndex = nv.interactiveBisect(series.values, e.pointXValue, chart.x());
                        stacked.highlightPoint(i, pointIndex, true);
                        var point = series.values[pointIndex];
                        if ("undefined" == typeof point) return;
                        "undefined" == typeof singlePoint && (singlePoint = point);
                        "undefined" == typeof pointXLocation && (pointXLocation = chart.xScale()(chart.x()(point, pointIndex)));
                        var tooltipValue = "expand" == stacked.style() ? point.display.y : chart.y()(point, pointIndex);
                        allData.push({
                            key: series.key,
                            value: tooltipValue,
                            color: color(series, series.seriesIndex),
                            stackedValue: point.display
                        });
                    });
                    allData.reverse();
                    if (allData.length > 2) {
                        var yValue = chart.yScale().invert(e.mouseY);
                        var indexToHighlight = null;
                        allData.forEach(function(series, i) {
                            yValue = Math.abs(yValue);
                            var stackedY0 = Math.abs(series.stackedValue.y0);
                            var stackedY = Math.abs(series.stackedValue.y);
                            if (yValue >= stackedY0 && stackedY + stackedY0 >= yValue) {
                                indexToHighlight = i;
                                return;
                            }
                        });
                        null != indexToHighlight && (allData[indexToHighlight].highlight = true);
                    }
                    var xValue = xAxis.tickFormat()(chart.x()(singlePoint, pointIndex));
                    var valueFormatter = "expand" == stacked.style() ? function(d) {
                        return d3.format(".1%")(d);
                    } : function(d) {
                        return yAxis.tickFormat()(d);
                    };
                    interactiveLayer.tooltip.position({
                        left: pointXLocation + margin.left,
                        top: e.mouseY + margin.top
                    }).chartContainer(that.parentNode).enabled(tooltips).valueFormatter(valueFormatter).data({
                        value: xValue,
                        series: allData
                    })();
                    interactiveLayer.renderGuideLine(pointXLocation);
                });
                interactiveLayer.dispatch.on("elementMouseout", function() {
                    dispatch.tooltipHide();
                    stacked.clearHighlights();
                });
                dispatch.on("tooltipShow", function(e) {
                    tooltips && showTooltip(e, that.parentNode);
                });
                dispatch.on("changeState", function(e) {
                    if ("undefined" != typeof e.disabled && data.length === e.disabled.length) {
                        data.forEach(function(series, i) {
                            series.disabled = e.disabled[i];
                        });
                        state.disabled = e.disabled;
                    }
                    "undefined" != typeof e.style && stacked.style(e.style);
                    chart.update();
                });
            });
            return chart;
        }
        var stacked = nv.models.stackedArea(), xAxis = nv.models.axis(), yAxis = nv.models.axis(), legend = nv.models.legend(), controls = nv.models.legend(), interactiveLayer = nv.interactiveGuideline();
        var x, y, margin = {
            top: 30,
            right: 25,
            bottom: 50,
            left: 60
        }, width = null, height = null, color = nv.utils.defaultColor(), showControls = true, showLegend = true, showXAxis = true, showYAxis = true, rightAlignYAxis = false, useInteractiveGuideline = false, tooltips = true, tooltip = function(key, x, y) {
            return "<h3>" + key + "</h3>" + "<p>" + y + " on " + x + "</p>";
        }, yAxisTickFormat = d3.format(",.2f"), state = {
            style: stacked.style()
        }, defaultState = null, noData = "No Data Available.", dispatch = d3.dispatch("tooltipShow", "tooltipHide", "stateChange", "changeState"), controlWidth = 250, cData = [ "Stacked", "Stream", "Expanded" ], controlLabels = {}, transitionDuration = 250;
        xAxis.orient("bottom").tickPadding(7);
        yAxis.orient(rightAlignYAxis ? "right" : "left");
        controls.updateState(false);
        var showTooltip = function(e, offsetElement) {
            var left = e.pos[0] + (offsetElement.offsetLeft || 0), top = e.pos[1] + (offsetElement.offsetTop || 0), x = xAxis.tickFormat()(stacked.x()(e.point, e.pointIndex)), y = yAxis.tickFormat()(stacked.y()(e.point, e.pointIndex)), content = tooltip(e.series.key, x, y, e, chart);
            nv.tooltip.show([ left, top ], content, 0 > e.value ? "n" : "s", null, offsetElement);
        };
        stacked.dispatch.on("tooltipShow", function(e) {
            e.pos = [ e.pos[0] + margin.left, e.pos[1] + margin.top ], dispatch.tooltipShow(e);
        });
        stacked.dispatch.on("tooltipHide", function(e) {
            dispatch.tooltipHide(e);
        });
        dispatch.on("tooltipHide", function() {
            tooltips && nv.tooltip.cleanup();
        });
        chart.dispatch = dispatch;
        chart.stacked = stacked;
        chart.legend = legend;
        chart.controls = controls;
        chart.xAxis = xAxis;
        chart.yAxis = yAxis;
        chart.interactiveLayer = interactiveLayer;
        d3.rebind(chart, stacked, "x", "y", "size", "xScale", "yScale", "xDomain", "yDomain", "xRange", "yRange", "sizeDomain", "interactive", "useVoronoi", "offset", "order", "style", "clipEdge", "forceX", "forceY", "forceSize", "interpolate");
        chart.options = nv.utils.optionsFunc.bind(chart);
        chart.margin = function(_) {
            if (!arguments.length) return margin;
            margin.top = "undefined" != typeof _.top ? _.top : margin.top;
            margin.right = "undefined" != typeof _.right ? _.right : margin.right;
            margin.bottom = "undefined" != typeof _.bottom ? _.bottom : margin.bottom;
            margin.left = "undefined" != typeof _.left ? _.left : margin.left;
            return chart;
        };
        chart.width = function(_) {
            if (!arguments.length) return width;
            width = _;
            return chart;
        };
        chart.height = function(_) {
            if (!arguments.length) return height;
            height = _;
            return chart;
        };
        chart.color = function(_) {
            if (!arguments.length) return color;
            color = nv.utils.getColor(_);
            legend.color(color);
            stacked.color(color);
            return chart;
        };
        chart.showControls = function(_) {
            if (!arguments.length) return showControls;
            showControls = _;
            return chart;
        };
        chart.showLegend = function(_) {
            if (!arguments.length) return showLegend;
            showLegend = _;
            return chart;
        };
        chart.showXAxis = function(_) {
            if (!arguments.length) return showXAxis;
            showXAxis = _;
            return chart;
        };
        chart.showYAxis = function(_) {
            if (!arguments.length) return showYAxis;
            showYAxis = _;
            return chart;
        };
        chart.rightAlignYAxis = function(_) {
            if (!arguments.length) return rightAlignYAxis;
            rightAlignYAxis = _;
            yAxis.orient(_ ? "right" : "left");
            return chart;
        };
        chart.useInteractiveGuideline = function(_) {
            if (!arguments.length) return useInteractiveGuideline;
            useInteractiveGuideline = _;
            if (true === _) {
                chart.interactive(false);
                chart.useVoronoi(false);
            }
            return chart;
        };
        chart.tooltip = function(_) {
            if (!arguments.length) return tooltip;
            tooltip = _;
            return chart;
        };
        chart.tooltips = function(_) {
            if (!arguments.length) return tooltips;
            tooltips = _;
            return chart;
        };
        chart.tooltipContent = function(_) {
            if (!arguments.length) return tooltip;
            tooltip = _;
            return chart;
        };
        chart.state = function(_) {
            if (!arguments.length) return state;
            state = _;
            return chart;
        };
        chart.defaultState = function(_) {
            if (!arguments.length) return defaultState;
            defaultState = _;
            return chart;
        };
        chart.noData = function(_) {
            if (!arguments.length) return noData;
            noData = _;
            return chart;
        };
        chart.transitionDuration = function(_) {
            if (!arguments.length) return transitionDuration;
            transitionDuration = _;
            return chart;
        };
        chart.controlsData = function(_) {
            if (!arguments.length) return cData;
            cData = _;
            return chart;
        };
        chart.controlLabels = function(_) {
            if (!arguments.length) return controlLabels;
            if ("object" != typeof _) return controlLabels;
            controlLabels = _;
            return chart;
        };
        yAxis.setTickFormat = yAxis.tickFormat;
        yAxis.tickFormat = function(_) {
            if (!arguments.length) return yAxisTickFormat;
            yAxisTickFormat = _;
            return yAxis;
        };
        return chart;
    };
})();