$(document).ready(function() {
    trends_selected = [
        [],
        [],
        []
    ];
    var selected_1 = 0;
    var selected_2 = 0;
    $.ajax({
        type: "GET",
        url: 'http://localhost:3001/countries/',
        dataType: "JSON",
        async: false,
        success: function(data) {
            $.each(data.countries, function(key, name) {

                //appending json data to dropdown country one and country two 
                $("#country1").append($('<option></option>').val(name).html(name));
                $("#country2").append($('<option></option>').val(name).html(name));
            });
            $('#country1, #country2').change(function() {
                //remove the svg so as to plot new each time
                d3.select("#chart").selectAll("svg").remove();

                // to check if one of the country is selected or both
                var country_selected = $(this).attr('id') == 'country1' ? "first_country" : "second_country";
                if (country_selected == "first_country") {
                    selected_1 = 1;
                }
                if (country_selected == "second_country") {
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
                        trends_selected[country_selected] = data.trends.map(function(a) {
                            return a.name;
                        });
                        if (selected_2 && selected_1) {
                            trends_selected["common"] = trends_selected["first_country"].filter(function(trend) {
                                return $.inArray(trend, trends_selected["second_country"]) != -1;
                            });
                        } else if (selected_1) {
                            trends_selected["common"] = trends_selected["first_country"];
                        } else if (selected_2) {
                            trends_selected["common"] = trends_selected["second_country"];
                        }
                        var common_trends = '<ul>';
                        for (var i = 0; i < trends_selected["common"].length; i++) {
                            common_trends += '<li>' + trends_selected["common"][i] + '</li>';
                        }
                        common_trends += '</ul>';
                        //displaying common trends info
                        $('#info').html(common_trends);
                        plotGraph(trends_selected["common"]);
                    }
                });
            });
        }

    });

    function plotGraph() {
        var data = [],
            sum = 0;
        $.each(trends_selected["common"], function() {
            sum += this.length;
        });
        $.each(trends_selected["common"],function(key, value) {
            data.push({
                "country_name": value,
                "percentage": (value.length / sum * 100).toFixed(1)
            });
        });
        var pie = d3.layout.pie()
            .value(function(d) {
                return d.percentage
            })
            .sort(null);

        var w = 800,
            h = 500;

        var outer_radius = 250;
        var inner_radius = 200;

        var color = d3.scale.category10();

        //dounut graph
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
                transform: 'translate(' + outer_radius + ',' + h / 2 + ')'
            });

        var path = svg.selectAll('path')
            .data(pie(data))
            .enter()
            .append('path')
            .attr({
                d: arc,
                fill: function(d, i) {
                    return color(d.data.country_name);
                }
            });
        //legends
        var createLegends = function() {
            var text = svg.selectAll('text')
                .data(pie(data))
                .enter()
                .append("text")
                .attr("transform", function(d) {
                    return "translate(" + arc.centroid(d) + ")";
                })
                .attr("dy", ".4em")
                .attr("text-anchor", "middle")
                .text(function(d) {
                    return d.data.percentage + "%";
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
                        return 'translate(355,' + ((i * legend_height) - 100) + ')';
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

        setTimeout(createLegends, 1000);

    }
});
