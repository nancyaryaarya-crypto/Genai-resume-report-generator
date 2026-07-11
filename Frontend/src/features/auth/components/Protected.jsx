import { Navigate } from "react-router";
import {useAuth} from "../hook/UseAuth";
import React from 'react'

const Protected = ({children}) => {

    const {loading ,user} = useAuth()
  

    if(loading){
        return<main>
            <h1>Loading..........</h1>
            </main>
    }

    if(!user){
        return <Navigate to={'/login'}/>
    }
    return children

  
}

export default Protected
