import {SignInButton, SignedIn, SignedOut, SignOutButton, UserButton } from '@clerk/clerk-react'

function App() {

  return (
    <>
      <h1>Video Calling Interview Platform</h1>
      <SignedOut>
        <SignInButton mode='modal'>
          <button>Log in</button>
        </SignInButton>
      </SignedOut>
    
      <SignedIn>
        <SignOutButton/>
      </SignedIn>

      <UserButton/>
    </>
  );
}

export default App
