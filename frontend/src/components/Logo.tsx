import React from 'react';
import logo from '../assets/logo.png';

export default function Logo(): JSX.Element {
    return (
        <div className="flex items-center">
            <img src={logo} alt="logo" className="w-12 h-12" />
        </div>
    );
}