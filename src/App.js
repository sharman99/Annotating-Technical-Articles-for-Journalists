import React from 'react';
import './App.css';
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import Modal from 'react-modal';
import Annotator from './Annotator';

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            modalOpened: false,
        };
    }

    componentDidMount() {
        console.log(React.version);
    }

    render() {
        return (
            <div className='App'>
                <Modal className='modal' isOpen={this.state.modalOpened}></Modal>
                <Annotator />
            </div>
        );
    }
}

export default App;
