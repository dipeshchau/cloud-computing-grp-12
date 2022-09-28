import React from 'react';
import { BrowserRouter, Route, Switch,  } from 'react-router-dom';
import Header from '../elements/Header/Header';
import Home from '../Home/Home';
import Movie from '../Movie/Movie';
import NotFound from '../elements/NotFound/NotFound';
import LoginPage from '../LoginPage.js/LoginPage';
import UserDetail from '../../User';



const App = () => {
  
return (
  <BrowserRouter>
    <React.Fragment>
      <Header  />
      <Switch>
        <Route path="/" component={Home} exact />
        <Route path="/:movieId" component={Movie} exact />
        <Route path="/app/login" component={LoginPage} exact />
        <Route path="/app/user" component={UserDetail} exact />
        <Route component={NotFound} />
      </Switch>
    </React.Fragment>
  </BrowserRouter>
)
}

export default App;