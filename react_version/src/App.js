import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css'
import Mainbody from './components/Mainbody'

function App() {
  return (
    <div className="App">
      <h2>COVID 19 US Case Map</h2>
      <Mainbody />
      <div className="footer">
        Copyright © 2020 Tianning Li. All Rights Reserved.
      </div>
    </div>
  );
}

export default App;
