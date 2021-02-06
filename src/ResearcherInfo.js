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
            author_name: 'ketil malde',
            citation_count: '',
            year_published: '',
            paper_name: 'indexing by latent semantic analysis',
        };
    }

    toggleModal() {
    }

    componentDidMount(){
        console.log(React.version)
         
        this.metadataPull()
    }

    metadataPull = async () => {
        var scraperapiClient = require('scraperapi-sdk')('d3316a379867bbb44fc3a4cab2b132e8')
        
        //query by author name
        //var response = await scraperapiClient.get('https://api.labs.cognitive.microsoft.com/academic/v1.0/evaluate?expr=Composite(AA.AuN==\'' + this.state.author_name + '\')&count=2&attributes=Ti,Y,CC,AA.AuN,AA.AuId&subscription-key=' + this.state.primary_key);

        //query by paper name 
        var response = await scraperapiClient.get('https://api.labs.cognitive.microsoft.com/academic/v1.0/evaluate?expr=Ti=\'' + this.state.paper_name + '\'&count=2&attributes=Ti,Y,CC,AA.AuN,DN,AA.AuId&subscription-key=' + this.state.primary_key);
        
        console.log(response)
        var jsonObject = JSON.parse(response);

        //json object info
        console.log(jsonObject)

        this.setState({citation_count: jsonObject.entities[0].CC})
        this.setState({year_published: jsonObject.entities[0].Y})
        this.setState({title: jsonObject.entities[0].DN})
    }

    render() {
        return (
            <div className='metadata'>
                <div><strong>Metadata</strong></div>
                <div>Title: {this.state.title}</div>
                <div>Citation Count: {this.state.citation_count}</div>
                <div>Year Published: {this.state.year_published}</div>
            </div>
        );
    }
}

export default ResearcherInfo;
