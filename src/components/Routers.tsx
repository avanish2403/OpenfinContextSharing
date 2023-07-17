import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import PopupWindow from "../pages/PopupWindow";


function Routers(){
  return(
    <div className="Routers">
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<div></div>}/>
          <Route path="/PopupWindow" element={<PopupWindow/>}/>
        </Routes>
        <Outlet />
      </BrowserRouter>
    </div>
  );
 }

export default Routers;
