import React, { useState } from "react";
import * as FaIcons from "react-icons/fa";
import * as AiIcons from "react-icons/ai";
import { Link } from "react-router-dom";
import "./style.css";
import { MenuData } from "../MenuData";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

function DropdownMenu() {
  const [userButton, setUserButton] = useState(false);

  const showMenu = () => setUserButton(!userButton);

  return (
    <div>
      <div className="ml5 userbtn">
        <Link to="#" className="green f1 ">
          <FaIcons.FaUserAlt onClick={showMenu} />
        </Link>
      </div>

      <nav className={userButton ? "drop-menu active" : "drop-menu"}>
        <ul className="w-100 pl0" onClick={showMenu}>
          {MenuData.map((item, index) => {
            return (
              <li key={index} className={item.cName}>
                <Link to={item.path}>
                  {item.icon}
                  <span className="ml2">{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export default DropdownMenu;
