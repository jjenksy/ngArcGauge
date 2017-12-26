
(function () {
    'use strict';

// Declare app level module which depends on views, and components
    const app = angular.module('ngJenksy', [
        'ngRoute',
        'myApp.version'
    ]);


    app.directive('arcGauge', function () {
        return {
            //template for directive
            restrict: 'E', //E = element, A = attribute, C = class, M = comment
            scope: {arggaugevalue: '=',
                     maxvalue: '=',
                     ticks: '=',
                     size: '=',
                     transitionspeed: '=',
                     ringwidth: '=',
                     canvaswidth: '=',
                     canvasheight: '='
            },
            //todo set the id dynamicallys
            template: '<div id="power-gauge"></div>',
            // templateUrl: 'mytemplate.html',
            link: function (scope, element, attrs) {
                //setup the initial gauge
                var powerGauge = gauge('#power-gauge', {
                    size: scope.size,
                    clipWidth: scope.canvaswidth,//width of the canvas
                    clipHeight: scope.canvasheight,
                    ringWidth: scope.ringwidth,
                    maxValue: scope.maxvalue,
                    majorTicks: scope.ticks, //how many ticks to display
                    transitionMs: scope.transitionspeed,
                    textColor: "#e7a61a"
                });
                //render the gauge
                powerGauge.render();

                // detect outside changes and update our input this will watch the set gauge value for any changes that happen
                scope.$watch('arggaugevalue', function(val) {
                    powerGauge.update(val);
                });




               function gauge(container, configuration) {
                    var that = {};
                    var config = {
                        size: 710,
                        clipWidth: 200,
                        clipHeight: 110,
                        ringInset: 20,
                        ringWidth: 20,
                        pointerColor: "#03f704",
                        pointerWidth: 1,
                        pointerTailLength: 1,
                        pointerHeadLengthPercent: 0.9,
                        pointerOffset: -65,
                        upperArcColor: "#207b3e", //color for the upper arc
                        minValue: 0,
                        maxValue: 10,

                        minAngle: -90,
                        maxAngle: 90,
                        textColor: "#e7a61a",
                        transitionMs: 750,

                        majorTicks: 5,
                        labelFormat: d3.format('d'),
                        labelInset: 10,
                        arcColorFn: d3.rgb('#445467')
                    };
                    var range = undefined;
                    var r = undefined;
                    var pointerHeadLength = undefined;

                    var svg = undefined;
                    var arc = undefined;
                    var scale = undefined;
                    var ticks = undefined;
                    var tickData = undefined;
                    var pointer = undefined;
                    var val = undefined;


                    function deg2rad(deg) {
                        return deg * Math.PI / 180;
                    }


                    function configure(configuration, pointerValue) {
                        if (configuration !== undefined) {
                            var prop = undefined;
                            for (prop in configuration) {
                                config[prop] = configuration[prop];
                            }
                        }

                        range = config.maxAngle - config.minAngle;
                        r = config.size / 2;
                        pointerHeadLength = Math.round(r * config.pointerHeadLengthPercent);
                        // a linear scale that maps domain values to a percent from 0..1
                        scale = d3.scaleLinear()
                            .range([0, 1])
                            .domain([config.minValue, config.maxValue]);

                        ticks = scale.ticks(config.majorTicks);
                        tickData = d3.range(config.majorTicks).map(function () {
                            return 1 / config.majorTicks;
                        });


                        arc = d3.arc()
                            .innerRadius(r - config.ringWidth - config.ringInset)
                            .outerRadius(r - config.ringInset)
                            .startAngle(function (d, i) {
                                var ratio = d * i;
                                return deg2rad(config.minAngle + (ratio * range));
                            })
                            .endAngle(function (d, i) {
                                var ratio = d * (i + 1);
                                return deg2rad(config.minAngle + (ratio * range));
                            });


                    }

                    that.configure = configure;

                    function centerTranslation() {
                        return 'translate(' + r + ',' + r + ')';
                    }

                    function isRendered() {
                        return (svg !== undefined);
                    }

                    that.isRendered = isRendered;

                    function render(newValue, pointerValue) {
                        svg = d3.select(container)
                            .append('svg:svg')
                            .attr('class', 'gauge')
                            .attr('width', config.clipWidth)
                            .attr('height', config.clipHeight);

                        var centerTx = centerTranslation();

                        var arcs = svg.append('g')
                            .attr('class', 'arc')
                            .attr('transform', centerTx);
                        var d = 0;
                        arcs.selectAll('path')
                            .data(tickData)
                            .enter().append('path')
                            .attr('fill', function (d2, i) {
                                // the tick data to the d var
                                d += d2;
                                console.log(pointerValue);
                                return config.arcColorFn;
                            })
                            .attr('d', arc);


                        var lg = svg.append('g')
                            .attr('class', 'label')
                            .attr('transform', centerTx);


                        lg.selectAll('text')
                            .data(ticks)
                            .enter().append('text')
                            .attr('transform', function (d) {
                                var ratio = scale(d);
                                var newAngle = config.minAngle + (ratio * range);

                                if (d == 0) {
                                    return 'rotate(' + newAngle + ') translate(0,' + (config.labelInset + 3 - r) + ')';
                                }

                                return 'rotate(' + newAngle + ') translate(0,' + (config.labelInset - r) + ')';
                            })
                            .text(config.labelFormat)
                            .attr('fill', config.textColor);

                        //section for centered point value
                        val = svg.append('g')
                            .attr('class', 'val')
                            .attr('transform', centerTx);
                        console.log('attr', attrs.gaugeid);
                        val.selectAll('text')
                            .data([0])
                            .enter()
                            .append('text')
                            .attr('class', 'pointValue')
                            .attr('id', attrs.gaugeid)
                            .attr('transform', function (d) {
                                return 'rotate(' + 0 + ') translate(0,' + -10 + ')';

                            }).text(config.labelFormat)
                            .attr('fill', config.textColor);

                        //M0.5,-65 L0,-135 L-0.5,-65 L0,-65 L0.5,-65
                        var lineData = [[config.pointerWidth / 2, config.pointerOffset],
                            [0, -pointerHeadLength],
                            [-(config.pointerWidth / 2), config.pointerOffset],
                            [0, config.pointerOffset],
                            [config.pointerWidth / 2, config.pointerOffset]];

                        var pointerLine = d3.line().curve(d3.curveLinear);
                        var pg = svg.append('g')
                            .attr('class', 'pointer')
                            .data([lineData])
                            .attr("stroke", config.pointerColor)
                            .attr('transform', 'translate(' + r + ',' + r + ')');


                        pointer = pg.append('path')
                            .attr('d', pointerLine/*function(d) { return pointerLine(d) +'Z';}*/)
                            .attr('transform', 'rotate(' + config.minAngle + ')');

                        update(newValue === undefined ? 0 : newValue);
                    }

                    that.render = render;

                    function update(newValue, newConfiguration) {
                        console.log(newValue);
                        configure(newConfiguration, newValue);
                        var ratio = scale(newValue);
                        var newAngle = config.minAngle + (ratio * range);
                        pointer.transition()
                            .duration(config.transitionMs)
                            .attr('transform', 'rotate(' + newAngle + ')');
                        d3.select("#" + attrs.gaugeid).text(newValue);
                    }

                    that.update = update;

                    configure(configuration);

                    return that;
                };
                //init the function






            }
        }
    });


    app.controller('GraphController', ['$scope','$interval', function ($scope, $interval) {

        let vm = this;
        vm.gaugevalue = 0;

        function updateReadings() {
            // just pump in random data here to fixed changes to the 100th p
            vm.gaugevalue = (Math.random() * 100).toFixed(2);
        }

        //dom safe interval updating
        $interval(function(){
            updateReadings();
        },5 * 1000);

    }]);
}());
