import React, { useState, useEffect } from 'react'
import { stateAbbreviation, stateCoor } from './StateInfo'
import countyCoor from './uscountyCoor.json';
import Plot from 'react-plotly.js';

// plots on geomap
export function Geoplot({ data, geo, choice, state, county }) {
    const [graphData, setGraphData] = useState({});
    const [center, setCenter] = useState([-95.61446, 38.72490, 2.3])

    useEffect(() => {
        let lats = [];
        let lons = [];
        let cases = [];
        let hoverText = [];
        let color = ''
        data.map(row => {
            let covid_case = 0;
            if (choice === 'Confirmed') {
                covid_case = row.Confirmed;
                color = '#D79913';
            } else {
                covid_case = row.Deaths;
                color = 'red';
            }
            if (geo === 'county') {
                let fips = row.FIPS;
                if (fips in countyCoor) {
                    lats.push(countyCoor[fips]['Lat']);
                    lons.push(countyCoor[fips]['Lon']);
                    cases.push(scaling(covid_case, choice) * 3);
                    hoverText.push(row.Province_State + ', ' + row.Admin2 + ": " + covid_case.toLocaleString());
                }
            } else {
                if (row.Province_State in stateCoor) {
                    lats.push(stateCoor[row.Province_State]['Latitude']);
                    lons.push(stateCoor[row.Province_State]['Longitude']);
                    cases.push(scaling(covid_case, choice) * 1.2);
                    hoverText.push(stateAbbreviation[row.Province_State] + ": " + covid_case.toLocaleString());
                }
            }
            return '';
        });
        if (state !== "" && state !== undefined && state !== 'US') {
            if(county ===""){
                let cenCoor = stateCoor[state];
                setCenter([cenCoor.Longitude, cenCoor.Latitude, 5]);
            }else{
                Object.entries(countyCoor).map( ([key, value]) => {
                    if(county === value.Admin2 && state === value.Province_State){
                        setCenter([value.Lon, value.Lat, 6]);
                    }
                    return '';
                })
            }
            
        }

        setGraphData({
            type: "scattermapbox",
            lat: lats,
            lon: lons,
            mode: "markers",
            text: hoverText,
            marker:
            {
                color: color,
                opacity: 0.5,
                size: cases
            }
        });
    }, [data, geo, choice, state, county])

    return (
        <Plot
            data={[graphData]}
            layout={{
                autosize: true,

                height: 500,
                width: window.innerWidth * 0.6,
                showlegend: false,
                mapbox: {
                    accesstoken: 'pk.eyJ1IjoicGxvdGx5bWFwYm94IiwiYSI6ImNqdnBvNDMyaTAxYzkzeW5ubWdpZ2VjbmMifQ.TXcBE-xg9BFdV2ocecc_7g',
                    style: "dark",
                    zoom: center[2],
                    center: { lon: center[0], lat: center[1] },
                    bearing: 0
                },
                margin: { t: 0, b: 0, l: 0, r: 0 },
                updatemenus: [
                    {
                        buttons: [
                            {
                                args: [{
                                    "mapbox.zoom": center[2],
                                    "mapbox.center.lon": center[0],
                                    "mapbox.center.lat": center[1],
                                    "mapbox.bearing": 0,
                                    "mapbox.style": "dark"
                                }],
                                label: "Reset Zoom",
                                method: "relayout",
                            }
                        ],
                        direction: "left",
                        pad: { l: 0, t: 0, b: 0, r: 0 },
                        showactive: false,
                        type: "buttons",
                        x: 0.45,
                        y: 0.02,
                        xanchor: "left",
                        yanchor: "bottom",
                        bgcolor: "#323130",
                        borderwidth: "1",
                        bordercolor: "#6d6d6d",
                        font: { color: "#FFFFFF" }
                    }
                ]
            }}
        />
    )
}

// time series plot for cases accross time
export function Timeseriesplot({ barData, choice }) {
    const [color, setColor] = useState('');
    useEffect(() => {
        if (choice === 'Deaths') {
            setColor('red');
        } else {
            setColor('#D79913');
        }
    }, [choice])

    return (
        <Plot
            data={[
                {
                    type: 'scatter',
                    x: barData['Date'],
                    y: barData['Cases'],
                    name: choice,
                    line: { color: color }
                },
                {
                    type: 'bar',
                    x: barData['Date'],
                    y: barData['DailyCases'],
                    name: `Daily_${choice}`,
                    yaxis: 'y2',
                    marker: { color: color }
                }
            ]}
            layout={{
                width: document.querySelector('div.col-md-6').clientWidth,
                height: 450,
                legend: {
                    font: {
                        size: 10
                    },
                    orientation: 'h',
                },
                title: `Number of ${choice} Cases`,
                plot_bgcolor: "#323130",
                paper_bgcolor: "#323130",
                font: {
                    family: "Open Sans, sans-serif",
                    size: 13,
                    color: "white"
                },
                xaxis: { rangeslider: { visible: true } },
                yaxis: {
                    zeroline: false,
                    gridcolor: '#6c6c6c',
                },
                yaxis2: {
                    anchor: "free",
                    overlaying: "y",
                    side: "right",
                    position: 1,
                    showgrid: false,
                    zeroline: false,
                }
            }}
        />
    )
}

// Plot top 15 areas and the proportion on pie charts
export function Pieplot({ loc, data, choice }) {
    return (
        <Plot
            data={[{
                type: 'pie',
                values: data,
                labels: loc,
                name: "Case Breakdown",
                hole: 0.5,

            }]}
            layout={{
                width: 400,
                height: 450,
                autosize: true,
                automargin: true,
                margin: {
                    l: 30, r: 30, b: 20, t: 40
                },
                hovermode: 'closest',
                plot_bgcolor: "#323130",
                paper_bgcolor: "#323130",
                font: {
                    family: "Open Sans, sans-serif",
                    size: 13,
                    color: "white"
                },
                legend: {
                    font: {
                        color: "#CCCCCC", size: 10
                    },
                    orientation: "v",
                    bgcolor: "rgba(0,0,0,0)",
                },
                title: `Top 15 ${choice} Cases Summary`,
            }}
        />
    )
}

function scaling(n, choice) {
    if (choice === 'Confirmed') {
        if (n < 5000) {
            return 1;
        } else if (n < 10000) {
            return 3;
        } else if (n < 50000) {
            return 5;
        } else if (n < 100000) {
            return 8;
        } else if (n < 500000) {
            return 10;
        } else if (n < 1000000) {
            return 20;
        } else if (n < 2000000) {
            return 30;
        } else {
            return 50;
        }
    } else {
        if (n < 100) {
            return 1;
        } else if (n < 500) {
            return 5;
        } else if (n < 1000) {
            return 10;
        } else if (n < 5000) {
            return 15;
        } else if (n < 10000) {
            return 20;
        } else if (n < 50000) {
            return 25;
        } else if (n < 100000) {
            return 30;
        } else {
            return 35;
        }
    }
}

