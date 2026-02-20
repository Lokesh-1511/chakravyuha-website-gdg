import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect,
} from "react-router-dom";
import "./index.css";
import SinglePage from "./SinglePage";
import { ChakravyuhaContentProvider } from "./data/chakravyuhaContent";

function App() {
  useEffect(() => {
    // Disable scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    
    // Scroll to top on load
    window.scrollTo(0, 0);
  }, []);

  return (
    <Router>
      <ChakravyuhaContentProvider>
        <div className="app">
          <Switch>
            <Route path="/" exact component={SinglePage} />
            <Redirect path="*" to="/" />
          </Switch>
        </div>
      </ChakravyuhaContentProvider>
    </Router>
  );
}

export default App;
