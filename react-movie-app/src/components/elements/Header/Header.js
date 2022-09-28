import React, { useEffect, useState } from 'react';
import { Link , useHistory, withRouter} from 'react-router-dom';
import { getLoggedInUser, logout } from '../../../service/user';
import './Header.css';

function Header() {
  const [user,setUser] = useState(null)
  const history = useHistory()
  
  useEffect(()=> {
    const storedUser = getLoggedInUser()
    setUser(storedUser)
  }, [])

  const onLogout = () => {
    logout()
    getLoggedInUser()
    setUser(null)
    history.push("/")
  }

  return (
  <div className="rmdb-header">
    <div className="rmdb-header-content">
      <Link to="/">
        <img className="rmdb-logo" src="/images/reactMovie_logo.png" alt="rmdb-logo" />
      </Link>
      
      <img className="rmdb-tmdb-logo" src="/images/tmdb_logo.png" alt="tmdb-logo" />
      
    </div>
    <div style={{   padding: "0 0 40px 10px" }}>
    {user ? <div>
      <p onClick={()=>onLogout()} style={{float: "right", cursor:"pointer", margin: "0 20px", color:"yellow"}} >
     Logout
    </p>
      <Link style={{float: "right", color:"green"}} to="/app/user">
     {user}
    </Link>
    
    </div> :
    
    <Link style={{float: "right", color:"red"}} to="/app/login">
     Login
    </Link>
   
}
</div>
  </div>
  
  
)
  }

export default withRouter(Header);