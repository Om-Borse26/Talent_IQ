import {SignInButton, SignedIn, SignedOut, SignOutButton, UserButton } from '@clerk/clerk-react'
import { Routes, Route } from 'react-router'
import HomePage from './Pages/HomePage.jsx'
import ProblemsPage from './Pages/ProblemsPage.jsx'
import { Toaster } from 'react-hot-toast'

function App() {

  const {isSignedIn} = useUser();

  return (
    <>
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/problems' element={isSignedIn ? <ProblemsPage /> : <Navigate to={"/"} />} />
        
      </Routes>

      <Toaster/>
    </>
  );
}

export default App
