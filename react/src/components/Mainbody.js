import React, { useEffect, useState } from 'react'
import {stateAbbreviation} from './StateInfo'
import { makeStyles } from '@material-ui/core/styles';
import {TextField, Select, MenuItem, Radio, RadioGroup,FormControlLabel} from '@material-ui/core/';
import * as d3 from 'd3';
import uscountyDict from './uscountyDict.json';
import axios from 'axios'
import {calculateCases, gettingData, gettingTopKData} from './util';
import Summary from './Summary'
import {Geoplot, Timeseriesplot, Pieplot} from './Dataplot'
import {Container, Row, Col} from 'react-bootstrap'

const useStyles = makeStyles((theme) => ({
    textField: {
        width:150,
        color:"white"
    },
    select: {
        width:150,
        color:"white"
    },
  }));

function Mainbody() {
    const classes = useStyles();
    const [choice, setChoice] = useState("Confirmed");
    const [geo, setGeo] = useState("county")
    const [date, setDate] = useState('');
    const [totalConfirmed, setTotalConfirmed] = useState(0);
    const [totalDeath, setTotalDeath] = useState(0);
    const [summary, setSummary] = useState([]);
    const [state, setState] = useState('US');
    const [county, setCounty] = useState('');
    const [countySelect, setCountySelect] = useState([]);
    const [stateData, setStateData] = useState({});
    const [countyData, setCountyData] = useState({});
    const [geoData, setGeoData] = useState([]);
    const [timeseriesPlot, setTimeseriesPlot] = useState([]);
    const [piePlot, setPiePlot] = useState([]);

    useEffect(()=>{
        if(date !== ''){
            d3.csv(`https://raw.githubusercontent.com/lit26/COVID19_Data/main/time_series_data/${date}/covid_19_${geo}.csv`, function(error,data){
                if(error){
                    alert(error.responseText);
                }else{
                    let total_confirmed = 0;
                    let total_death = 0;
                    
                    data.forEach(function(d) {
                        d.Confirmed = +d.Confirmed;
                        d.Deaths = +d.Deaths;
                        d.Daily_Confirmed = +d.Daily_Confirmed;
                        d.Daily_Deaths = +d.Daily_Deaths;
                        total_confirmed = total_confirmed+d.Confirmed;
                        total_death = total_death+d.Deaths;
                    });
                    setTotalConfirmed(total_confirmed);
                    setTotalDeath(total_death);
                    setGeoData(data);
                }
            });
        }
        
    },[date, choice, geo])

    useEffect(()=>{
        axios.get('https://raw.githubusercontent.com/lit26/COVID19_Data/main/data/covid_19_state_v1.json')
            .then(res => {
                let dailyConfirmed = calculateCases(res.data.Data, 'Confirmed');
                let dailyDeaths = calculateCases(res.data.Data, 'Deaths');
                setStateData(res.data.Data);
                setDate(dailyConfirmed.Date[dailyConfirmed.Date.length-1]);
                setSummary(<Summary currentDate={dailyConfirmed.Date[dailyConfirmed.Date.length-1]} 
                                    currentConfirmed={dailyConfirmed.Data[dailyConfirmed.Data.length-1]}
                                    currentDeath={dailyDeaths.Data[dailyDeaths.Data.length-1]}/>)
            })
            .catch(err =>{
                console.log(err)
            })
        axios.get('https://raw.githubusercontent.com/lit26/COVID19_Data/main/data/covid_19_county_v1.json')
            .then(res =>{
                setCountyData(res.data.Data);
            })
            .catch(err =>{
                console.log(err)
            })
    },[])

    useEffect(()=>{
        if(state !== 'US'){
            setCountySelect(
                <Select
                    value={county} 
                    className={classes.select}
                    onChange={(e)=>setCounty(e.target.value) }
                >
                    <MenuItem value="">All Counties</MenuItem>
                    {uscountyDict[state].map( value => {
                        return <MenuItem key={value} value={value}>{value}</MenuItem>
                    })}
                </Select>
            );
        }else{
            setCountySelect([])
            setCounty('');
        }
    },[state, county, classes.select])

    useEffect(()=>{
        let barData = gettingData(state, county, stateData, countyData, choice);
        setTimeseriesPlot(<Timeseriesplot barData={barData} choice={choice}/>)
    },[state, county, stateData, countyData, choice])

    useEffect(()=>{
        let returnData = gettingTopKData(state, stateData, countyData, choice);
        let loc = returnData[0];
        let data = returnData[1];
        setPiePlot(<Pieplot loc={loc} data={data} choice={choice}/>)
    },[state, stateData, countyData, choice])

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
                                onChange={(e)=>setDate(e.target.value)}
                                className={classes.textField}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                        </div>
                        <div className="Mainbody__summary">
                            <p>Confirmed: {totalConfirmed.toLocaleString()}</p>
                            <p>Deaths: {totalDeath.toLocaleString()}</p>
                        </div>
                        <Select
                            value={choice}
                            onChange={(e)=>setChoice(e.target.value)}
                            className={classes.select}
                        >
                            <MenuItem value={"Confirmed"}>Confirmed</MenuItem>
                            <MenuItem value={"Deaths"}>Deaths</MenuItem>
                        </Select>
                        <RadioGroup value={geo} onChange={(e) =>setGeo(e.target.value)}>
                            <FormControlLabel value="county" control={<Radio color="primary"/>} label="By County" />
                            <FormControlLabel value="state" control={<Radio color="primary"/>} label="By State" />

                        </RadioGroup>
                    </Col>
                    <Col md={7}>
                        <Geoplot data={geoData} geo={geo} choice={choice} state={state} county={county}/>
                    </Col>
                </Row>
                <Row>
                    <Col md={2}>
                        <Select
                            value={state}
                            className={classes.select}
                            onChange={(e) =>setState(e.target.value)}
                        >
                            <MenuItem value="US">All States</MenuItem>
                            {Object.entries(stateAbbreviation).map( ([key, value]) => {
                                return <MenuItem value={key}>{key}</MenuItem>
                            })}
                        </Select>
                        {countySelect}
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
