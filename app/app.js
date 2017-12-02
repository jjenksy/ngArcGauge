'use strict';

// Declare app level module which depends on views, and components
var app = angular.module('ngJenksy', [
  'ngRoute',
  'myApp.view1',
  'myApp.view2',
  'myApp.version'
]);

app.directive('arcGauge', function () {
    return {
        //template for directive
        restrict: 'EA', //E = element, A = attribute, C = class, M = comment
        scope: {
            //@ reads the attribute value, = provides two-way binding, & works with functions
            title: '@'         },
        //todo set the id dynamically
        template: '<div id="power-gauge"></div>',
        // templateUrl: 'mytemplate.html',
        link: function ($scope, element, attrs) {
            var gauge = function(container, configuration) {
                var that = {};
                var config = {
                    size						: 710,
                    clipWidth					: 200,
                    clipHeight					: 110,
                    ringInset					: 20,
                    ringWidth					: 20,
                    pointerColor                : "#03f704",
                    pointerWidth				: 1,
                    pointerTailLength			: 1,
                    pointerHeadLengthPercent	: 0.9,
                    pointerOffset               : -65,
                    upperArcColor               : "#207b3e", //color for the upper arc
                    minValue					: 0,
                    maxValue					: 10,

                    minAngle					: -90,
                    maxAngle					: 90,
                    textColor                   : "#e7a61a",
                    transitionMs				: 750,

                    majorTicks					: 5,
                    labelFormat					: d3.format('d'),
                    labelInset					: 10,

                    arcColorFn					: d3.interpolateHsl(d3.rgb('#445467'), d3.rgb('#445467'))
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


                function deg2rad(deg) {
                    return deg * Math.PI / 180;
                }


                function configure(configuration) {
                    var prop = undefined;
                    for ( prop in configuration ) {
                        config[prop] = configuration[prop];
                    }

                    range = config.maxAngle - config.minAngle;
                    r = config.size / 2;
                    pointerHeadLength = Math.round(r * config.pointerHeadLengthPercent);
                    // a linear scale that maps domain values to a percent from 0..1
                    scale = d3.scaleLinear()
                        .range([0,1])
                        .domain([config.minValue, config.maxValue]);

                    ticks = scale.ticks(config.majorTicks);
                    tickData = d3.range(config.majorTicks).map(function() {return 1/config.majorTicks;});

                    arc = d3.arc()
                        .innerRadius(r - config.ringWidth - config.ringInset)
                        .outerRadius(r - config.ringInset)
                        .startAngle(function(d, i) {
                            var ratio = d * i;
                            return deg2rad(config.minAngle + (ratio * range));
                        })
                        .endAngle(function(d, i) {
                            var ratio = d * (i+1);
                            return deg2rad(config.minAngle + (ratio * range));
                        });
                }
                that.configure = configure;

                function centerTranslation() {
                    return 'translate('+r +','+ r +')';
                }

                function isRendered() {
                    return (svg !== undefined);
                }
                that.isRendered = isRendered;

                function render(newValue) {
                    svg = d3.select(container)
                        .append('svg:svg')
                        .attr('class', 'gauge')
                        .attr('width', config.clipWidth)
                        .attr('height', config.clipHeight);

                    var centerTx = centerTranslation();

                    var arcs = svg.append('g')
                        .attr('class', 'arc')
                        .attr('transform', centerTx);

                    arcs.selectAll('path')
                        .data(tickData)
                        .enter().append('path')
                        .attr('fill', function(d, i) {
                            return config.arcColorFn(d * i);
                        })
                        .attr('d', arc);

                    var lg = svg.append('g')
                        .attr('class', 'label')
                        .attr('transform', centerTx);

                    lg.selectAll('text')
                        .data(ticks)
                        .enter().append('text')
                        .attr('transform', function(d) {
                            var ratio = scale(d);
                            var newAngle = config.minAngle + (ratio * range);
                            return 'rotate(' +newAngle +') translate(0,' +(config.labelInset - r) +')';
                        })
                        .text(config.labelFormat)
                        .attr('fill', config.textColor);
                    //M0.5,-65 L0,-135 L-0.5,-65 L0,-65 L0.5,-65
                    var lineData = [ [config.pointerWidth / 2, config.pointerOffset],
                        [0, -pointerHeadLength],
                        [-(config.pointerWidth / 2), config.pointerOffset],
                        [0, config.pointerOffset],
                        [config.pointerWidth / 2, config.pointerOffset] ];

                    var pointerLine = d3.line().curve(d3.curveLinear);
                    var pg = svg.append('g')
                        .attr('class', 'pointer')
                        .data([lineData])
                        .attr("stroke", config.pointerColor)
                        .attr('transform', 'translate('+r +','+ r +')');



                    pointer = pg.append('path')
                        .attr('d', pointerLine/*function(d) { return pointerLine(d) +'Z';}*/ )
                        .attr('transform', 'rotate(' +config.minAngle +')');

                    update(newValue === undefined ? 0 : newValue);
                }
                that.render = render;
                function update(newValue, newConfiguration) {
                    if ( newConfiguration  !== undefined) {
                        configure(newConfiguration);
                    }
                    var ratio = scale(newValue);
                    var newAngle = config.minAngle + (ratio * range);
                    pointer.transition()
                        .duration(config.transitionMs)
                        .attr('transform', 'rotate(' +newAngle +')');
                }
                that.update = update;

                configure(configuration);

                return that;
            };
            // element.bind('click', function () {
            //     element.html('You clicked me!');
            // });
            // element.bind('mouseenter', function () {
            //     element.css('background-color', 'yellow');
            // });
            // element.bind('mouseleave', function () {
            //     element.css('background-color', 'white');
            // });

            //init the function
            function onDocumentReady() {
                var powerGauge = gauge('#power-gauge', {
                    size: 300,
                    clipWidth: 300,
                    clipHeight: 300,
                    ringWidth: 60,
                    maxValue: 100,
                    majorTicks: 10, //how many ticks to display
                    transitionMs: 4000,
                    textColor:"#e7a61a"
                });
                powerGauge.render();

                function updateReadings() {
                    // just pump in random data here...
                    powerGauge.update(Math.random() * 100);
                }

                // every few seconds update reading values
                updateReadings();
                // setInterval(function() {
                //     updateReadings();
                // }, 5 * 1000);
            }

            if ( !window.isLoaded ) {
                window.addEventListener("load", function() {
                    onDocumentReady();
                }, false);
            } else {
                onDocumentReady();
            }
        }
    }
});


app.controller('CustomersController', ['$scope', function ($scope) {
    var counter = 0;
    $scope.customer = {
        name: 'David',
        street: '1234 Anywhere St.'
    };

    $scope.customers = [
        {
            name: 'David',
            street: '1234 Anywhere St.'
        },
        {
            name: 'Tina',
            street: '1800 Crest St.'
        },
        {
            name: 'Michelle',
            street: '890 Main St.'
        }
    ];

    $scope.addCustomer = function () {
        counter++;
        $scope.customers.push({
            name: 'New Customer' + counter,
            street: counter + ' Cedar Point St.'
        });
    };

    $scope.changeData = function () {
        counter++;
        $scope.customer = {
            name: 'James',
            street: counter + ' Cedar Point St.'
        };
    };
}]);

