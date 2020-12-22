import React, { useEffect, useState } from 'react'
import { stateAbbreviation } from './StateInfo'
import { makeStyles } from '@material-ui/core/styles';
import { TextField, Select, MenuItem } from '@material-ui/core/';
import * as d3 from 'd3';
import uscountyDict from './uscountyDict.json';
import axios from 'axios'
import { calculateCases, gettingData, gettingTopKData } from './util';
import Summary from './Summary'
import { Geoplot, Choroplethplot, Timeseriesplot, Pieplot } from './Dataplot'
import { Container, Row, Col } from 'react-bootstrap'
import PlayCircleIcon from '@material-ui/icons/PlayCircleOutline'

const useStyles = makeStyles((theme) => ({
    textField: {
        width: 150,
        color: "white"
    },
    select: {
        width: 150,
        color: "white"
    },
}));

function Mainbody() {
    const classes = useStyles();
    const [choice, setChoice] = useState("Confirmed");
    const [geo, setGeo] = useState("state")
    const [date, setDate] = useState('');
    const [totalConfirmed, setTotalConfirmed] = useState(0);
    const [totalDeath, setTotalDeath] = useState(0);
    const [totalDailyConfirmed, setDailyConfirmed] = useState(0);
    const [totalDailyDeath, setDailyDeath] = useState(0);
    const [dailyRecords, setDailyRecords] = useState(0);
    const [summary, setSummary] = useState([]);
    const [state, setState] = useState('US');
    const [county, setCounty] = useState('');
    const [choiceMenu, setChoiceMenu] = useState([]);
    const [countySelect, setCountySelect] = useState([]);
    const [stateData, setStateData] = useState({});
    const [countyData, setCountyData] = useState({});
    const [hospitalData, setHospitalData] = useState({});
    const [geoData, setGeoData] = useState([]);
    const [geoPlot, setGeoPlot] = useState([]);
    const [timeseriesPlot, setTimeseriesPlot] = useState([]);
    const [piePlot, setPiePlot] = useState([]);
    const [timeline, setTimeline] = useState([]);
    const [hospitalTimeline, setHospitalTimeline] = useState([]);
    const [dateIndex, setDateIndex] = useState('');

    // getting state and county data 
    useEffect(() => {
        axios.get('https://raw.githubusercontent.com/lit26/COVID19_Data/main/data/covid_19_state_v1.json')
            .then(res => {
                let dailyConfirmed = calculateCases(res.data.Data, 'Confirmed');
                let dailyDeaths = calculateCases(res.data.Data, 'Deaths');
                setStateData(res.data.Data);
                setTimeline(dailyConfirmed.Date);
                setDate(dailyConfirmed.Date[dailyConfirmed.Date.length - 1]);
                setSummary(<Summary currentDate={dailyConfirmed.Date[dailyConfirmed.Date.length - 1]}
                    currentConfirmed={dailyConfirmed.Data[dailyConfirmed.Data.length - 1]}
                    currentDeath={dailyDeaths.Data[dailyDeaths.Data.length - 1]} />)
            })
            .catch(err => {
                console.log(err)
            })
        axios.get('https://raw.githubusercontent.com/lit26/COVID19_Data/main/data/covid_19_county_v1.json')
            .then(res => {
                setCountyData(res.data.Data);
            })
            .catch(err => {
                console.log(err)
            })
        d3.csv('https://raw.githubusercontent.com/lit26/COVID19_Data/main/data/hospital_data.csv').then(function (data) {
            let availableDates = []
            data.forEach(function (d) {
                if (!availableDates.includes(d['collection_date'])) {
                    availableDates.push(d['collection_date']);
                }
                d['Inpatient Beds Occupied Estimated'] = + d['Inpatient Beds Occupied Estimated'].split(',').join('');
                d['Inpatient Beds Occupied by COVID-19 Patients Estimated'] = + d['Inpatient Beds Occupied by COVID-19 Patients Estimated'].split(',').join('');
                d['Percentage of Inpatient Beds Occupied Estimated'] = + d['Percentage of Inpatient Beds Occupied Estimated'];
                d['Percentage of Inpatient Beds Occupied by COVID-19 Patients Estimated'] = + d['Percentage of Inpatient Beds Occupied by COVID-19 Patients Estimated'];
                d['Percentage of Staffed Adult ICU Beds Occupied Estimated'] = + d['Percentage of Staffed Adult ICU Beds Occupied Estimated'];
                d['Staffed Adult ICU Beds Occupied Estimated'] = + d['Staffed Adult ICU Beds Occupied Estimated'].split(',').join('');
                d['Total Inpatient Beds'] = + d['Total Inpatient Beds'].split(',').join('');
                d['Total Staffed Adult ICU Beds'] = + d['Total Staffed Adult ICU Beds'].split(',').join('');
            })
            setHospitalData(data);
            setHospitalTimeline(availableDates);
        });
    }, [])

    // getting data for maps according to the dates
    useEffect(() => {
        if (date !== '') {
            if (choice === 'Confirmed' || choice === 'Deaths' || choice === 'Daily_Confirmed' || choice === 'Daily_Deaths') {
                d3.csv(`https://raw.githubusercontent.com/lit26/COVID19_Data/main/time_series_data/${date}/covid_19_${geo}.csv`).then(function (data) {
                    let total_confirmed = 0;
                    let total_death = 0;
                    let total_daily_confirmed = 0;
                    let total_daily_death = 0;

                    data.forEach(function (d) {
                        d.Confirmed = +d.Confirmed;
                        d.Deaths = +d.Deaths;
                        d.Daily_Confirmed = +d.Daily_Confirmed;
                        d.Daily_Deaths = +d.Daily_Deaths;
                        total_confirmed = total_confirmed + d.Confirmed;
                        total_death = total_death + d.Deaths;
                        total_daily_confirmed = total_daily_confirmed + d.Daily_Confirmed;
                        total_daily_death = total_daily_death + d.Daily_Deaths;
                    });
                    setTotalConfirmed(total_confirmed);
                    setTotalDeath(total_death);
                    setDailyConfirmed(total_daily_confirmed);
                    setDailyDeath(total_daily_death);
                });

                let data = [];
                if (geo === 'county' && Object.keys(countyData).length !== 0) {
                    let dateIndex = countyData['Alabama']['1001.0']['Date'].indexOf(date);
                    if (dateIndex !== -1) {
                        setDateIndex(dateIndex);
                        Object.entries(countyData).map(([key1, state]) => {
                            Object.entries(state).map(([key2, value]) => {
                                data.push({
                                    'Province_State': key1,
                                    'FIPS': key2,
                                    'Admin2': value.County,
                                    'Confirmed': value.Confirmed[dateIndex],
                                    'Deaths': value.Deaths[dateIndex],
                                    'Daily_Confirmed': value.Daily_Confirmed[dateIndex],
                                    'Daily_Deaths': value.Daily_Deaths[dateIndex]
                                })
                                return '';
                            })
                            return '';
                        })
                        setGeoData(data);
                    } else {
                        alert(`Invalid Date. Available dates: ${timeline[0]} - ${timeline[timeline.length - 1]}`);
                    }

                } else if (geo === 'state' && Object.keys(stateData).length !== 0) {
                    let dateIndex = stateData['Alabama']['Date'].indexOf(date);
                    if (dateIndex !== -1) {
                        setDateIndex(dateIndex);
                        Object.entries(stateData).map(([key1, value]) => {
                            data.push({
                                'Province_State': key1,
                                'Confirmed': value.Confirmed[dateIndex],
                                'Deaths': value.Deaths[dateIndex],
                                'Daily_Confirmed': value.Daily_Confirmed[dateIndex],
                                'Daily_Deaths': value.Daily_Deaths[dateIndex]
                            })
                            return '';
                        })
                        setGeoData(data);
                    } else {
                        alert(`Invalid Date. Available dates: ${timeline[0]} - ${timeline[timeline.length - 1]}`);
                    }
                }
            } else {
                let hospital_data = hospitalData.filter(each => each.collection_date === date);
                if (hospital_data.length > 0) {
                    setGeoData(hospital_data);
                } else {
                    alert(`Invalid Date. Available dates: ${hospitalTimeline[0]} - ${hospitalTimeline[hospitalTimeline.length - 1]}`);
                }
            }

        }

    }, [date, choice, geo, stateData, countyData, hospitalData, timeline, hospitalTimeline]);

    // getting counties according to the state
    useEffect(() => {
        if (state !== 'US') {
            let areas = ['Guam', 'Northern Mariana Islands', 'Virgin Islands'];
            if (areas.includes(state) === false) {
                setCountySelect(
                    <Select
                        value={county}
                        className={classes.select}
                        onChange={(e) => setCounty(e.target.value)}
                    >
                        <MenuItem value="">All Counties</MenuItem>
                        {uscountyDict[state].map(value => {
                            return <MenuItem key={value} value={value}>{value}</MenuItem>
                        })}
                    </Select>
                );
            } else {
                setCountySelect(
                    <Select
                        value={county}
                        className={classes.select}
                        onChange={(e) => setCounty(e.target.value)}
                    >
                    </Select>
                );
            }
        } else {
            setCountySelect([])
            setCounty('');
        }
    }, [state, county, classes.select])

    useEffect(() => {
        if (geo === 'state') {
            setChoiceMenu(
                <Select
                    value={choice}
                    onChange={(e) => setChoice(e.target.value)}
                    className={classes.select}
                >
                    <MenuItem value="Confirmed">Confirmed</MenuItem>
                    <MenuItem value="Deaths">Deaths</MenuItem>
                    <MenuItem value="Daily_Confirmed">Daily Confirmed</MenuItem>
                    <MenuItem value="Daily_Deaths">Daily Deaths</MenuItem>
                    <MenuItem value="Inpatient Beds Occupied Estimated">Inpatient Beds Occupied * </MenuItem>
                    <MenuItem value="Inpatient Beds Occupied by COVID-19 Patients Estimated">Inpatient Beds Occupied by COVID-19 Patients * </MenuItem>
                    <MenuItem value="Staffed Adult ICU Beds Occupied Estimated">Staffed Adult ICU Beds Occupied * </MenuItem>
                </Select>
            )
        } else {
            setChoiceMenu(
                <Select
                    value={choice}
                    onChange={(e) => setChoice(e.target.value)}
                    className={classes.select}
                >
                    <MenuItem value="Confirmed">Confirmed</MenuItem>
                    <MenuItem value="Deaths">Deaths</MenuItem>
                    <MenuItem value="Daily_Confirmed">Daily Confirmed</MenuItem>
                    <MenuItem value="Daily_Deaths">Daily Deaths</MenuItem>
                </Select>
            )
        }
    }, [choice, geo, classes.select])

    // plot the map
    useEffect(() => {
        if (choice === 'Confirmed' || choice === 'Deaths' || choice === 'Daily_Confirmed' || choice === 'Daily_Deaths') {
            setGeoPlot(
                <Geoplot data={geoData} geo={geo} choice={choice} state={state} county={county} />
            )
        } else {
            setGeoPlot(<Choroplethplot geoData={geoData} choice={choice} state={state} />)
        }
    }, [geoData, geo, choice, state, county])

    // plot the bar chart and line chart
    useEffect(() => {
        if (choice === 'Confirmed' || choice === 'Deaths' || choice === 'Daily_Confirmed' || choice === 'Daily_Deaths') {
            let selection = choice.replace('Daily_', '');
            let timeseriesData = gettingData(state, county, stateData, countyData, selection);
            let record = Math.max.apply(Math, timeseriesData.DailyCases);
            setTimeseriesPlot(<Timeseriesplot x={timeseriesData['Date']}
                lineData={timeseriesData['Cases']}
                barData={timeseriesData['DailyCases']}
                choice={selection}
                record={new Array(timeseriesData.Date.length).fill(record)} />);
            setDailyRecords(record);
        }
    }, [state, county, stateData, countyData, hospitalData, choice])

    // plot the pie chart
    useEffect(() => {
        if (choice === 'Confirmed' || choice === 'Deaths' || choice === 'Daily_Confirmed' || choice === 'Daily_Deaths') {
            let selection = choice.replace('Daily_', '');
            let returnData = gettingTopKData(state, stateData, countyData, selection, dateIndex, dateIndex);
            let loc = returnData[0];
            let data = returnData[1];
            setPiePlot(<Pieplot loc={loc} data={data} choice={selection} />)
        }
    }, [state, stateData, countyData, choice, dateIndex])

    // play the history when the button is clicked
    const playHistory = () => {
        let playTimeLine = [];
        if (choice === 'Confirmed' || choice === 'Deaths' || choice === 'Daily_Confirmed' || choice === 'Daily_Deaths') {
            playTimeLine = timeline;
        } else {
            playTimeLine = hospitalTimeline;
        }

        for (let i = 1; i < playTimeLine.length; i++) {
            setTimeout(() => {
                setDate(playTimeLine[i]);
            }, i * 100);
        }
    }

    return (
        <div className="Mainbody">
            <Container>
                <Row>
                    <Col md={3}>
                        {summary}
                        <div>
                            <TextField
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className={classes.textField}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                        </div>
                        <div className="Mainbody__summary">
                            <p>Confirmed: {totalConfirmed.toLocaleString()}</p>
                            <p>Deaths: {totalDeath.toLocaleString()}</p>
                            <p>Daily Confirmed: {totalDailyConfirmed.toLocaleString()}</p>
                            <p>Daily Deaths: {totalDailyDeath.toLocaleString()}</p>
                        </div>
                        <Select
                            value={geo}
                            onChange={(e) => setGeo(e.target.value)}
                            className={classes.select}
                        >
                            <MenuItem value="state">By State</MenuItem>
                            <MenuItem value="county">By County</MenuItem>
                        </Select>
                        <div className="Mainbody__play">
                            <p>Play history: </p>
                            <PlayCircleIcon onClick={playHistory} />
                        </div>
                        {choiceMenu}
                    </Col>
                    <Col md={7}>
                        {geoPlot}
                    </Col>
                </Row>
                <Row>
                    <Col md={2}>
                        <Select
                            value={state}
                            className={classes.select}
                            onChange={(e) => setState(e.target.value)}
                        >
                            <MenuItem value="US">All States</MenuItem>
                            {Object.entries(stateAbbreviation).map(([key, value]) => {
                                return <MenuItem value={key}>{key}</MenuItem>
                            })}
                        </Select>
                        {countySelect}
                        <br />
                        <p>Max Daily Record: {dailyRecords.toLocaleString()}</p>
                    </Col>
                    <Col md={6}>
                        {timeseriesPlot}
                    </Col>
                    <Col md={4}>
                        {piePlot}
                    </Col>
                </Row>
            </Container>
        </div>
    )
}

export default Mainbody
