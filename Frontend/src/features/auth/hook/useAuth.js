import {useContext, useEffect} from "react"
import {AuthContext} from "../auth.context"
import{login,register,logout,getMe} from "../services/auth.api"



export const useAuth = ()=> 
    {
        const context = useContext(AuthContext) 
        const {user, setUser,loading,setLoading} = context

        const handleLogin = async ({ email,password})=>{
            setLoading(true)
            try{
                 const data =await login({email,password})
                 if (data?.user) {
                    setUser(data.user)
                 }
                 return data
            }catch(err){
                console.log(err)
                return null
            }finally{
                 setLoading(false)

            }
           
           
        }

        const handleRegister = async ({ username,email,password}) => {
            setLoading(true)

            try{
                const data = await register({ username,email,password})
                if (data?.user) {
                    setUser(data.user)
                }
                return data

            }catch(err){
                console.log(err)
                return null
            }finally {
                setLoading(false)

            }
            
           
        }


        const handleLogout = async () => {
            setLoading(true)
            try{
                 const data = await logout()
                setUser(null)

            }catch(err){

            }finally{
                setLoading(false)

            }
            
           
        }


       
    useEffect(() => {
        const getAndSetUser = async () => {
           try {
             const data = await getMe();
             if (data && data.user) {
                setUser(data.user);
            } else {
              setUser(null);
            }
          } catch (error) {
      // Agar status 401 hai (yaani user logged in nahi hai), toh bina laal error ke handle karein
           if (error.response && error.response.status === 401) {
              console.log("No active session found - User is a guest.");
          } else {
        // Kisi aur actual server/network issue ke liye console me error dikhayein
             console.error("Backend connect nahi ho paya:", error);
            }
            setUser(null);
         } finally {
           setLoading(false); // Ye loading screen ko har haal mein hata dega
         }
        };
        // const getAndSetUser = async () => { 
        //     try {
        //       const data = await getMe();
      
        //       if (data && data.user) {
        //       setUser(data.user);
        //    } else {
        //       setUser(null);
        //    }
        //    } catch (error) {
        //        console.error("Backend connect nahi ho paya:", error);
        //        setUser(null);
        //    } finally {
        //         setLoading(false); // Ye loading screen ko har haal mein hata dega
        //    }
        // };

            getAndSetUser();
    }, []);

        return {
            user,
            loading,
            handleLogin,
            handleRegister,
            handleLogout
        }
    }