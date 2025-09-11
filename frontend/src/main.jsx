// import React from "react";
// import ReactDOM from "react-dom/client";
// import { BrowserRouter } from "react-router-dom";
// import App from "./App";
// import { AuthProvider } from "./contexts/AuthContext";
// import "./index.css"; 

// ReactDOM.createRoot(document.getElementById("root")).render(
//   <React.StrictMode>
//      <Provider store={store}>
//       <BrowserRouter>
//         <App />
//       </BrowserRouter>
//     </Provider>
//   </React.StrictMode>
// );







// import React from "react";
// import ReactDOM from "react-dom/client";
// import { Provider } from "react-redux"; 
// import { BrowserRouter } from "react-router-dom";
// import { store } from "./store/store"; 
// import App from "./App";
// import "./index.css"; 

// // Remove the old AuthProvider since we're using Redux now
// // import { AuthProvider } from "./contexts/AuthContext";

// ReactDOM.createRoot(document.getElementById("root")).render(
//   <React.StrictMode>
//     <Provider store={store}>
//       <BrowserRouter>
//         <App />
//       </BrowserRouter>
//     </Provider>
//   </React.StrictMode>
// );








import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux"; 
import { BrowserRouter } from "react-router-dom";
import { store } from "./store/store"; 
import App from "./App";
import "./index.css"; 

// Remove the old AuthProvider since we're using Redux now
// import { AuthProvider } from "./contexts/AuthContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);