import react, { useState } from 'react'
import {useNavigate,Link} from "react-router"
import { useAuth } from '../hook/useAuth'

const Register = ()=> {

    const [username,setUsername] = useState('')
    const [email,setEmail]= useState("")
    const [password,setPassword] =  useState("")

    const navigate = useNavigate();

    const {loading, handleRegister} = useAuth()


      const handlesubmit =  async (e) => {
        e.preventDefault()
        const data = await handleRegister({ username,email,password})

        if (data?.user) {
            navigate("/")
        }
    }





    return(
         <main>
            <div className="form-container">
                <h1>Register</h1>
                <form onSubmit={handlesubmit}>

                    <div className="input-group">
                        <label htmlFor="username">Username</label>
                        <input
                         onChange = {(e)=>{setUsername(e.target.value)}}
                         type="text" id="username" name='username' placeholder="Enter username"/>


                    </div>

                 
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input 
                        onChange = {(e)=>{setEmail(e.target.value)}}
                        type="email" id="email" name='email' placeholder="Enter email address"/>


                    </div>

                    <div className="input-group">
                        <label htmlFor="password">password</label>
                        <input
                         onChange = {(e)=>{setPassword(e.target.value)}}
                         type="password" id="password" name='password' placeholder='Enter password'/>


                    </div>

                    <button className="button primary-button" type='submit'>Register</button>
                </form>

                <p>Already have an account? <Link to={"/login"}>Login</Link></p>

            </div>
        </main>
    )
}
export default Register