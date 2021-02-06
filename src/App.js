import React, {useState} from 'react';
import './App.css';
import Modal from 'react-modal';
import PDFViewer from './PDFViewer';

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            modalOpened: false,
        };
    }

    toggleModal() {
    }

    componentDidMount(){
        console.log(React.version)
    }

    render() {
        return (
            <div className="App">                
                <Modal className="modal"
                isOpen={this.state.modalOpened}>
                </Modal>
                
                <PDFViewer/>
            </div>
        );
    }
}

export default App;
