import React from 'react';
import './App.css';
import Modal from 'react-modal';

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
    }

    render() {
        return (
            <div className="App">
                <Modal className="modal"
                isOpen={this.state.modalOpened}>
                </Modal>
            </div>
        );
    }
}

export default App;
