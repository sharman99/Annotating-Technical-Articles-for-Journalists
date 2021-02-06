import React, {useState} from 'react';
import './App.css';

//Microsoft Academic Knowledge API: https://docs.microsoft.com/en-us/academic-services/project-academic-knowledge/reference-interpret-method
//https://docs.microsoft.com/en-us/academic-services/project-academic-knowledge/reference-evaluate-method


class ResearcherInfo extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            modalOpened: false,
            results: 'jksd',
            primary_key: '55af519e0f3b4c5c9292e7b21bbe37b0',
            author_name: '',
            citation_count: '',
            year_published: '',
            default_paper: 'indexing by latent semantic analysis',
            paper_name: '',

            found_paper: null,
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    toggleModal() {
    }

    componentDidMount(){
        console.log(React.version)

        console.log("paper name: " + this.state.paper_name)
    }


    metadataPull = async (edited) => {
        var scraperapiClient = require('scraperapi-sdk')('d3316a379867bbb44fc3a4cab2b132e8')
        
        //query by author name
        //var response = await scraperapiClient.get('https://api.labs.cognitive.microsoft.com/academic/v1.0/evaluate?expr=Composite(AA.AuN==\'' + this.state.author_name + '\')&count=2&attributes=Ti,Y,CC,AA.AuN,AA.AuId&subscription-key=' + this.state.primary_key);

        //query by paper name 
        var response = await scraperapiClient.get('https://api.labs.cognitive.microsoft.com/academic/v1.0/evaluate?expr=Ti=\'' + edited + '\'...&count=2&attributes=Ti,Y,CC,AA.AuN,DN,AA.AuId&subscription-key=' + this.state.primary_key);
        
        console.log(response)
        var jsonObject = JSON.parse(response);

        //json object info
        console.log(jsonObject)
        
        if(jsonObject.entities.length != 0){
            this.setState({found_paper: true})
            this.setState({citation_count: jsonObject.entities[0].CC})
            this.setState({year_published: jsonObject.entities[0].Y})
            this.setState({title: jsonObject.entities[0].DN})
        }
        else{
            this.setState({found_paper: false});
            this.setState({title: ''})
            this.setState({citation_count: ''})
            this.setState({year_published: ''})
        }
    }

    handleSubmit(event){
        //this.setState({found_paper: true});
        event.preventDefault();
        var edited = this.state.paper_name.replace(/[^\w\s]/gi, '');
        this.setState({paper_name: ""})
        edited = edited.toLowerCase();
        console.log("edited: " + edited)
        this.metadataPull(edited);
        this.setState({submitted: true})
    }

    handleChange(event){
        this.setState({paper_name : event.target.value})
        this.setState({submitted: false})
    }

    render() {
        return (
            <div className='metadata'>
                <div><strong>Metadata Search:</strong></div>

                <form onSubmit={this.handleSubmit}>
                    <label>
                        Search for paper by name:
                        <input type="text" value={this.state.paper_name} onChange={this.handleChange}/>
                    </label>
                    <input type="submit" value="Submit" />
                </form>

                {!this.state.found_paper && this.state.submitted && this.state.paper_name != '' && <div id="red">Cannot Find Paper</div>}

                <div><strong>Results:</strong></div>
                <div>
                    <div>Title: {this.state.title}</div>
                    <div>Citation Count: {this.state.citation_count}</div>
                    <div>Year Published: {this.state.year_published}</div>
                </div>
            </div>
        );
    }
}

export default ResearcherInfo;
