import countyCoor from './uscountyCoor.json';

// adding two array pairwise
function add(arr1, arr2) {
    return arr1.map(function (value, index) {
        return value + arr2[index];
    });
}

// calculate the cases for the whole US
export function calculateCases(data, choice) {
    if (Object.keys(data).length !== 0) {
        let summation = new Array(data['Alabama']['Date'].length).fill(0);
        Object.entries(data).map(([key, value]) => {
            let cases = value[choice];
            summation = add(summation, cases);
            return '';
        })
        return { 'Date': data['Alabama'].Date, 'Data': summation };
    } else {
        return null;
    }
}

// get the data according to the user area input
export function gettingData(state, county, stateData, countyData, choice) {
    let cases = [];
    let dailyCases = [];
    let dates = [];
    if (state === 'US') {
        let temp = calculateCases(stateData, choice);
        if (temp !== null) {
            dates = temp['Date'];
            cases = temp['Data'];
            dailyCases = calculateCases(stateData, 'Daily_' + choice)['Data'];
        }
    } else if (county === '') {
        dates = stateData[state]['Date'];
        cases = stateData[state][choice];
        dailyCases = stateData[state]['Daily_' + choice];
    } else {
        Object.entries(countyCoor).map(([key, value]) => {
            if (county === value.Admin2 && state === value.Province_State) {
                dates = countyData[state][key]['Date'];
                cases = countyData[state][key][choice];
                dailyCases = countyData[state][key]['Daily_' + choice];
            }
            return '';
        })
    }
    return { 'Date': dates, 'Cases': cases, 'DailyCases': dailyCases };
}

// getting the top cases for the pie chart
export function gettingTopKData(state, stateData, countyData, choice, dateIndex) {
    let loc = [];
    let data = [];
    let cases = [];
    if (state === 'US') {
        cases = Object.keys(stateData).map(function (key) {
            let data = stateData[key][choice];
            return [key, data[dateIndex]];
        });

    } else {
        cases = Object.keys(countyData[state]).map(function (key) {
            let data = countyData[state][key][choice];
            return [countyData[state][key]['County'], data[dateIndex]];
        });
    }
    cases.sort(function (first, second) {
        return second[1] - first[1];
    });
    let other = 0;
    cases.map((value, index) => {
        if (index < 15) {
            loc.push(value[0]);
            data.push(value[1]);
        } else {
            other = other + value[1];
        }
        return ""
    })
    loc.push('Other');
    data.push(other);
    return [loc, data];
}