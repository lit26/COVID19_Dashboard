import React from 'react'

function Summary({currentDate, currentConfirmed, currentDeath}) {
    return (
        <>
            <p>Data Source: Johns Hopkins CSSE and HealthData.gov. </p>
            <p>By {currentDate}, there are {currentConfirmed.toLocaleString()} confirmed and {currentDeath.toLocaleString()} deaths cases.</p>
        </>
    )
}

export default Summary
