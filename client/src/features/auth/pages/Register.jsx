import React , { useState } from 'react'
import { useNavigate, Link} from "react-router"
import {useAuth} from "../hooks/useAuth.js"


const Register = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email,setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { loading , handleRegister } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleRegister({ username, email, password});
    navigate("/");
    //Handle login logic here
  };

  if(loading){
    return (<main><h1>Loading...</h1></main>)
  }


  return (
    <main>
      <div className="form-container">
        <h1>Resigter</h1>
        <form  onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input  onChange={(e) => setUsername(e.target.value)} type="username" id="username" name="Username" placeholder='Username' required />

          </div>

          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input onChange={(e) => setEmail(e.target.value)} type="email" id="email" name="email" placeholder='Enter email address' required />

          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input onChange={(e) => setPassword(e.target.value)}type="password" id="password" name="password" placeholder='Enter password' required/>
            
          </div>
          <button className='button primary-button'>Register</button>
        </form>
        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </main>
  )
}

export default Register
