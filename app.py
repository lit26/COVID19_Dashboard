import dash
import dash_core_components as dcc
import dash_html_components as html
import pandas as pd

from util import state_list, readData

from dash.dependencies import Input, Output, State
from plotly import graph_objs as go
from plotly.graph_objs import *
from datetime import datetime as dt



app = dash.Dash(
    __name__, meta_tags=[{"name": "viewport", "content": "width=device-width"}]
)
server = app.server

# Plotly mapbox public token
mapbox_access_token = "pk.eyJ1IjoicGxvdGx5bWFwYm94IiwiYSI6ImNqdnBvNDMyaTAxYzkzeW5ubWdpZ2VjbmMifQ.TXcBE-xg9BFdV2ocecc_7g"

# Load location coordinates
df_stateLoc = pd.read_csv("data/statelatlong.csv")

# Initialize data frame
def loadData():
    df = readData()

    df["Admin2"] = df["Admin2"].fillna(df["Province_State"])
    df_state = df.groupby(["Province_State", "Date"]).sum().reset_index()
    df_state = df_state[["Province_State","Date","Confirmed","Deaths","Daily_Confirmed","Daily_Deaths"]]
    df_state = pd.merge(left=df_state, right=df_stateLoc, how='left', left_on='Province_State', right_on='State')
    df_state = df_state.drop(["State"],axis=1)
    return df, df_state

def getLocMap():
    state_admin2 = [df[df["Province_State"]==i]["Admin2"].unique().tolist() for i in state_list]
    state_dictionary = dict(zip(state_list, state_admin2))
    return state_dictionary

def getCurrentStatus():
    startDate = df['Date'].iloc[0]
    dayData = df[["Date","Confirmed","Deaths"]].groupby(["Date"]).sum().reset_index()
    currentData = dayData[-1:]
    currentDate = currentData.iloc[0]["Date"]
    currentConfirmed = currentData.iloc[0]["Confirmed"]
    currentDeaths = currentData.iloc[0]["Deaths"]
    return startDate, dayData, currentDate, currentConfirmed, currentDeaths

# Load options
def getDropdownOptions():
    state_options = [{"label":i,"value":i} for i in state_list]
    state_options = [{"label":"State","value":"US"}]+state_options
    admin2_list = df["Admin2"].unique().tolist()
    admin2_list.sort()
    admin2_options = [{"label":i,"value":i} for i in admin2_list]
    admin2_options = [{"label":"County","value":"N/A"}] + admin2_options
    return state_options, admin2_options

df, df_state = loadData()
state_dictionary = getLocMap()
startDate, dayData, currentDate, currentConfirmed, currentDeaths = getCurrentStatus()
state_options, admin2_options = getDropdownOptions()

# Scale
caseConfirmedScale = {range(0,1000): 1,
                     range(1000,5000): 5,
                     range(5000,10000): 10,
                     range(10000,50000): 15,
                     range(50000,100000): 20,
                     range(100000,500000): 25,
                     range(500000,1000000): 30,
                     range(1000000,5000000): 35
                     }
caseDeathScale = {range(1, 100): 1,
                  range(100,500): 5,
                  range(500,1000): 10,
                  range(1000,5000): 15,
                  range(5000,10000): 20,
                  range(10000,50000): 25,
                  range(50000,100000): 30,
                  range(100000,500000): 35,
                 }

# Layout of Dash App
app.layout = html.Div(
    children=[
        html.Div(
            className="row",
            children=[
                # Column 
                html.Div(
                    className="twelve columns",
                    children=[
                        html.H2("COVID 19 US Case Map"),
                    ],
                ),
                # Column 
                html.Div(
                    className="four columns",
                    children=[
                        html.P(
                            """Data Source: Johns Hopkins CSSE (Subjected to data structure change)."""
                        ),
                        html.P("By {}, there are {:,} confirmed cases and {:,} deaths."
                            .format(currentDate.strftime("%Y-%m-%d"),
                                    currentConfirmed,
                                    currentDeaths),
                            id="summary"),
                        html.Div(
                            className="div-for-dropdown",
                            children=[
                                dcc.DatePickerSingle(
                                    id="date-picker",
                                    min_date_allowed=startDate,
                                    max_date_allowed=currentDate,
                                    initial_visible_month=currentDate,
                                    date=currentDate.date(),
                                    display_format="MMMM D, YYYY",
                                    style={"border": "0px solid black"},
                                ),
                            ],
                        ),
                        html.P("Confirmed: 0",
                                id="graphConfirmed"),
                        html.P("Deaths: 0",
                                id="graphDeaths"),

                        # Change to side-by-side for mobile layout
                        html.Div(
                            className="row",
                            children=[
                                html.Div(
                                    className="div-for-dropdown",
                                    children=[
                                        # Dropdown to select times
                                        dcc.Dropdown(
                                            id="case-selector",
                                            options=[
                                                {
                                                    "label": "Confirmed",
                                                    "value": "Confirmed",
                                                },
                                                {
                                                    "label": "Deaths",
                                                    "value": "Deaths",
                                                }                                                
                                            ],
                                            value="Confirmed",                                                                                    
                                        ),
                                        # Dropdown to select times
                                        dcc.RadioItems(
                                            id="area-selector",
                                            options=[
                                                {
                                                    "label": "By County",
                                                    "value": "County",
                                                },
                                                {
                                                    "label": "By State",
                                                    "value": "State",
                                                },                                           
                                            ],
                                            value="County",     
                                        ),                                        
                                    ],
                                ),
                            ],
                        ),                        
                    ],
                ),
                
                # Column for app graphs and plots
                html.Div(
                    className="seven columns",
                    children=[
                        dcc.Graph(id="map-graph"),  
                    ],
                ),
            ],
        ),
        html.Div(
            className="row",
            children=[
                # Column 
                html.Div(
                    className="two columns",
                    children=[
                        
                        # Change location
                        html.Div(
                            children=[
                                html.Div(
                                    className="twelve columns",
                                    children=[
                                        dcc.Dropdown(                                           
                                            options=state_options,
                                            id="state-dropdown",
                                            placeholder="State"
                                        ),
                                    ],
                                ),
                                html.Div(
                                    className="twelve columns",
                                    children=[
                                        dcc.Dropdown(                                            
                                            options=admin2_options,
                                            id="county-dropdown",
                                            placeholder="County",
                                            style={
                                                "marginBottom":"10px"
                                            }
                                        ),
                                    ],
                                ),
                            ],
                        ),
                        html.P(id="area-place"),
                        html.P(id="area-confirmed"),
                        html.P(id="area-deaths")
                    ],
                ),
                html.Div(
                    className="six columns",
                    children=[
                        dcc.Graph(id="time-series-plot"), 
                    ],
                ),
                html.Div(
                    className="four columns",
                    children=[
                        dcc.Graph(id="pie_graph"), 
                    ],
                    style={
                        'marginLeft':"0px"
                    }
                ),
            ],
            style={
                'paddingLeft':'55px',
                'paddingTop':'20px',
            }
        ),
        dcc.Markdown(
            children=[
                "Copyright © 2020 Tianning Li. All rights reserved."
            ],
            style={
                'paddingLeft':'55px',
                'marginBottom':'20px',
            }
        ),
    ]
)

@app.callback(
    [
        Output("area-place", "children"), 
        Output("area-confirmed", "children"), 
        Output("area-deaths", "children"),         
    ],
    [
        Input("state-dropdown","value"),
        Input("county-dropdown","value"),
    ]
)
def update_data_confirmed(state,county):
    if county != "N/A" and county != "" and county is not None:        
        df_current = df[df["Admin2"] == county]
        current_place = "Area: {0}".format(county)
    elif state != "US" and state !="" and state is not None:
        df_current = df_state[df_state["Province_State"] == state]
        current_place = "Area: {0}".format(state)
    else :
        df_current = df.groupby(["Date"]).sum().reset_index()
        current_place = "Area: {0}".format("US")
    current_confirmed = "Confirmed: {:,}".format(df_current["Confirmed"][-1:].values[0])
    current_deaths = "Deaths: {:,}".format(df_current["Deaths"][-1:].values[0])
    return current_place, current_confirmed, current_deaths

# Update county based on state
@app.callback(
    Output("county-dropdown","options"),
    [
        Input("state-dropdown","value"),
    ]
)
def updateOptions(state):
    if state == "US" or state =="" or state is None:
        return admin2_options
    elif state in state_dictionary:
        county_list = state_dictionary[state]
        county_list.sort()
        county_options = [{"label":i,"value":i} for i in county_list]
        county_options = [{"label":"Select County","value":"N/A"}]+county_options
        return county_options

# Update state based on county
@app.callback(
    Output("state-dropdown","value"),
    [
        Input("county-dropdown","value"),
    ]
)
def updateState(county):
    for key, value in state_dictionary.items():
        if county in value:
            return key

# Update Map Graph
@app.callback(
    [
        Output("map-graph", "figure"),
        Output("graphConfirmed", "children"),
        Output("graphDeaths", "children"),
    ],
    [
        Input("date-picker", "date"),
        Input("case-selector", "value"),
        Input("area-selector", "value"),
        Input("state-dropdown","value"),
        Input("county-dropdown","value"),
    ],
)
def update_graph(datePicked,casePicked,areaPicked,state,county):
    zoom = 2.7
    latInitial = 38.72490
    lonInitial = -95.61446
    bearing = 0
    df_area = df
    if areaPicked =="County":
        df_area["hovertext"] = df_area["Admin2"]+", "+df_area["Province_State"]
    elif areaPicked == "State":
        df_area = df_state
        df_area["hovertext"] = df_area["Province_State"]

    if county != "N/A" and county != "" and county is not None and county != "Unassigned":        
        zoom = 6
        location = df[["Admin2","Latitude","Longitude"]].drop_duplicates()
        location = location[location["Admin2"] == county]
        latInitial = location['Latitude'].values[0]
        lonInitial = location['Longitude'].values[0]
    elif state != "US" and state !="" and state is not None:
        zoom = 4.4
        location = df_stateLoc[df_stateLoc["State"] == state]
        latInitial = location['Latitude'].values[0]
        lonInitial = location['Longitude'].values[0]

    df_area = df_area[df_area['Latitude'] != 0]
    date_picked = dt.strptime(datePicked, "%Y-%m-%d")
    listCoords = df_area[df_area["Date"]==date_picked]
    d = caseDeathScale if casePicked=="Deaths" else caseConfirmedScale

    USmap =  go.Figure(
        data=[
            # Data for all rides based on date and time
            Scattermapbox(
                lat=listCoords["Latitude"],
                lon=listCoords["Longitude"],
                mode="markers",
                hoverinfo="text",
                text = listCoords["hovertext"]+": "+listCoords[casePicked].astype(str),
                marker=dict(                   
                    color= 'red'if casePicked=="Deaths" else '#D79913',
                    opacity=0.5,
                    size=listCoords[casePicked].apply(lambda x: next((v for k, v in d.items() if int(x) in k), 0)).to_numpy(),
                ),
            ),       
        ],
        layout=Layout(
            autosize=True,
            height=500,
            margin=go.layout.Margin(l=0, r=35, t=0, b=0),
            showlegend=False,
            mapbox=dict(
                accesstoken=mapbox_access_token,
                center=dict(lat=latInitial, lon=lonInitial),  # 38.72490  # -95.61446
                style="dark",
                bearing=bearing,
                zoom=zoom,
            ),
            
            updatemenus=[
                dict(
                    buttons=(
                        [
                            dict(
                                args=[
                                    {
                                        "mapbox.zoom": zoom,
                                        "mapbox.center.lon": "-95.61446",
                                        "mapbox.center.lat": "38.72490",
                                        "mapbox.bearing": 0,
                                        "mapbox.style": "dark",
                                    }
                                ],
                                label="Reset Zoom",
                                method="relayout",
                            )
                        ]
                    ),
                    direction="left",
                    pad={"r": 0, "t": 0, "b": 0, "l": 0},
                    showactive=False,
                    type="buttons",
                    x=0.45,
                    y=0.02,
                    xanchor="left",
                    yanchor="bottom",
                    bgcolor="#323130",
                    borderwidth=1,
                    bordercolor="#6d6d6d",
                    font=dict(color="#FFFFFF"),
                )
            ],
        ),
    )
    dayData = df[["Date","Confirmed","Deaths"]].groupby(["Date"]).sum().reset_index()
    day_data = dayData[dayData["Date"]==date_picked]
    confirmedCase = "Confirmed: {:,}".format(day_data["Confirmed"][-1:].values[0])
    deathCase = "Deaths: {:,}".format(day_data["Deaths"][-1:].values[0])
    return USmap, confirmedCase, deathCase

# Update plot
@app.callback(
    Output("time-series-plot", "figure"),
    [
        Input("case-selector", "value"),
        Input("state-dropdown","value"),
        Input("county-dropdown","value"),
    ],
)
def update_plot(casePicked, state,county):
    if county != "N/A" and county != "" and county is not None:        
        df_day = df[df["Admin2"] == county]
    elif state != "US" and state !="" and state is not None:
        df_day = df_state[df_state["Province_State"] == state]
    else :
        df_day = df.groupby(["Date"]).sum().reset_index()
    
    yVal = df_day[casePicked]
    yVal2 = df_day["Daily_"+casePicked]
  
    fig = go.Figure()
    fig.add_trace(go.Scatter(
            x=df_day["Date"],
            y=yVal,
            name=casePicked,
            line=dict(
                color='red' if casePicked=="Deaths" else '#D79913'
            ),
        ),
    )
    fig.add_trace(go.Bar(
            x=df_day["Date"],
            y=yVal2,
            name="Daily_"+casePicked,
            yaxis="y2",
            marker=dict(
                    color='red' if "Daily_"+casePicked=="Daily_Deaths" else '#D79913'                    
                ),
            ),
    )
    fig.update_layout(
        height=450,
        legend=dict(font=dict(size=10), orientation="h"),
        title="Number of {} Cases".format(casePicked),
        plot_bgcolor="#323130",
        paper_bgcolor="#323130",
        font=dict(family="Open Sans, sans-serif", size=13, color="white"),
        xaxis=dict(rangeslider=dict(visible=True)),
        yaxis=dict(
            zeroline=False,
            gridcolor='#6c6c6c',
        ),
        yaxis2=dict(
            anchor="free",
            overlaying="y",
            side="right",
            position=1,
            showgrid=False,
            zeroline=False,
        ),
    )
    return fig

# Update Pie Graph
@app.callback(
    Output("pie_graph", "figure"),
    [
        Input("date-picker", "date"),
        Input("case-selector", "value"),
        Input("state-dropdown","value"),
    ],
)
def update_pie(datePicked, casePicked, state):
    df_area = df
    area = "Province_State"
    date_picked = dt.strptime(datePicked, "%Y-%m-%d")
    df_day = df_area[df_area["Date"]==date_picked]

    if state != "US" and state !="" and state is not None:
        area = "Admin2"
        df_day = df_day[df_day["Province_State"]==state]

    aggregate = df_day.groupby([area]).sum().reset_index()
    aggregate_top = aggregate[[area, casePicked]].nlargest(10, casePicked)
    other = aggregate[casePicked].sum() - aggregate_top[casePicked].sum()
    aggregate_top = aggregate_top.append({area: 'Other',casePicked: other}, ignore_index=True)
    data = [
        dict(
            type="pie",
            labels=aggregate_top[area].tolist(),
            values=aggregate_top[casePicked],
            name="Case Breakdown",
            hoverinfo="label+text+value+percent",
            textinfo="label+percent+name",
            hole=0.5,
            marker=dict(colors=aggregate_top[area].tolist()),
        ),
    ]
    layout_pie = dict(
        autosize=True,
        automargin=True,
        margin=dict(l=30, r=30, b=20, t=40),
        hovermode="closest",
        plot_bgcolor="#323130",
        paper_bgcolor="#323130",
        font=dict(family="Open Sans, sans-serif", size=10, color="white"),
        legend=dict(
        font=dict(color="#CCCCCC", size="10"), orientation="v", bgcolor="rgba(0,0,0,0)"),
        title=" {} Cases Summary".format(casePicked),
    )

    figure = dict(data=data, layout=layout_pie)
    return figure


if __name__ == "__main__":
    app.run_server(debug=True)





