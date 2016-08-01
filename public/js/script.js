$(document).ready(function() {
    arr = [[],[],[]];
    var selected_2 = 0;
    var selected_1 = 0;
    $.ajax({
        type: "GET",
        url: 'http://localhost:3001/countries/',
        dataType: "JSON",
        async: false,
        success: function(data) {
            $.each(data.countries, function(key, value) {
                $("#country1").append($('<option></option>').val(value).html(value));
                $("#country2").append($('<option></option>').val(value).html(value));
            });
            $('#country1, #country2').change(function() {
                d3.select("#chart").selectAll("svg").remove();

                var country_number = $(this).attr('id') == 'country1' ? 1 : 2;
                if (country_number == 1) {
                    selected_1 = 1;
                }
                if (country_number == 2) {
                    selected_2 = 1;
                }
                var country = $(this).val();
                //finding common trends
                $.ajax({
                    type: "GET",
                    url: 'http://localhost:3001/countries/' + country + '/trends/',
                    dataType: "JSON",
                    async: false,
                    success: function(data) {
                        arr[country_number] = data.trends.map(function(a) {
                            return a.name;
                        });
                        if (selected_2 && selected_1) {
                            arr[0] = arr[1].filter(function(el) {
                                return $.inArray(el, arr[2]) != -1;
                            });
                        } else if (selected_1) {
                            arr[0] = arr[1];
                        } else if (selected_2) {
                            arr[0] = arr[2];
                        }
                        var html = '<ul>';
                        for (var i = 0; i < arr[0].length; i++) {
                            html += '<li>' + arr[0][i] + '</li>';
                        }
                        html += '</ul>';
                        $('#info').html(html);
                        plotGraph(arr[0]);
                    }
                });
            });
        }

    });

    function plotGraph() {
        var data = [],
            sum = 0;
        var args = Array.prototype.slice.call(arguments);
        $.each(arr[0], function() {
            sum += this.length;
        });
        args[0].forEach(function(value, key) {
            data.push({
                "label": value,
                "value": (value.length / sum * 100).toFixed(1)
            });
        });
        var pie = d3.layout.pie()
            .value(function(d) {
                return d.value
            })
            .sort(null);

        var w = 500,
            h = 500;

        var outer_radius = w / 2;
        var inner_radius = 200;

        var color = d3.scale.category10();

        var arc = d3.svg.arc()
            .outerRadius(outer_radius)
            .innerRadius(inner_radius);

        var svg = d3.select("#chart")
            .append("svg")
            .attr({
                width: w,
                height: h,
                class: 'shadow'
            }).append('g')
            .attr({
                transform: 'translate(' + w / 2 + ',' + h / 2 + ')'
            });
        var path = svg.selectAll('path')
            .data(pie(data))
            .enter()
            .append('path')
            .attr({
                d: arc,
                fill: function(d, i) {
                    return color(d.data.label);
                }
            });

        var restOfData = function() {
            var text = svg.selectAll('text')
                .data(pie(data))
                .enter()
                .append("text")
                .transition()
                .duration(200)
                .attr("transform", function(d) {
                    return "translate(" + arc.centroid(d) + ")";
                })
                .attr("dy", ".4em")
                .attr("text-anchor", "middle")
                .text(function(d) {
                    return d.data.value + "%";
                })
                .style({
                    fill: '#fff',
                    'font-size': '10px'
                });

            var legend_rect_size = 20;
            var legend_spacing = 7;
            var legend_height = legend_rect_size + legend_spacing;


            var legend = svg.selectAll('.legend')
                .data(color.domain())
                .enter()
                .append('g')
                .attr({
                    class: 'legend',
                    transform: function(d, i) {
                        //Just a calculation for x & y position
                        return 'translate(-55,' + ((i * legend_height) - 100) + ')';
                    }
                });
            legend.append('rect')
                .attr({
                    width: legend_rect_size,
                    height: legend_rect_size,
                    rx: 20,
                    ry: 20
                })
                .style({
                    fill: color,
                    stroke: color
                });

            legend.append('text')
                .attr({
                    x: 30,
                    y: 15
                })
                .text(function(d) {
                    return d;
                }).style({
                    'font-size': '14px'
                });
        };

        setTimeout(restOfData, 1000);

    }
});