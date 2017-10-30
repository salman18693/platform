import React, { Component } from 'react';
import '../Styles/AboutDesign.css';
import { Row, Col, MenuItem, DropdownButton } from 'react-bootstrap';
import { Selection, SelectMultiple } from '../Components/Selection'
import { AddLink } from '../Components/AddLink';
import axios from 'axios';
import{ basepath} from '../utils/constant'
import {validateUrl} from '../utils/Methods';


// const dropdownList = (title,field,onclick)=>{
//   return (
//     <div className="input-spacing">
//       <Selection
//         placeholder={title}
//         optionList={['Existing Product','Start Afresh']}
//         onclick={(value,key)=>onclick}/>
//   </div>
//   );
// }
let DropdownList = (props) => {
    return (
        <div className="input-spacing">
            <Selection
                placeholder={props.placeholder}
                error={props.className}
                optionList={props.list}
                onclick={props.onChange} />
        </div>
    );
}

export default class AboutDesign extends Component {
    constructor(props) {
        super(props);
        this.state = {
            platforms: [],
            services: '',
            objective: '',
            domains: '',
            addLink: [],
            document: '',
            platformClass: false,
            servicesClass: false,
            objectiveClass: false,
            linkClass: false,
            designList: ['a', 'b'],
            objectiveList: ['New platform', 'Improve conversions', 'Improve engagement',
                'Improve retention', 'Improve overall experience', 'Improve aesthetics'],
            platformList: ['Mac App', 'Android wearable', 'Apple watch', 'VR',
                'Windows app', 'IOS app', 'Android app', 'Web app', 'Responsive web'],
            loading: false,
            edit: true,
            projectId: '',
        }
    }
    componentWillMount = () => {
        setTimeout(() => { this.getAboutDesignData() }, 500)
        //console.log("getting uuuuuuuuuuuuuu",localStorage.getItem('userName'));
        //console.log("getting uuuuuuuuuuuuuu",localStorage.getItem('userId'));
        // this.getAboutDesignData();
    }
  
  componentWillMount = () => {
    this.getAboutDesignData()
   //   setTimeout(()=>{this.getAboutDesignData()},10)
    //console.log("getting uuuuuuuuuuuuuu",localStorage.getItem('userName'));
    //console.log("getting uuuuuuuuuuuuuu",localStorage.getItem('userId'));
   // this.getAboutDesignData();
}

// componentDidMount() {
//     setTimeout(()=>{this.getAboutDesignData()},1000)
// }
getAboutDesignData=()=>{
    if(localStorage.getItem("projectId"))
    {
        this.setState({
            loading:true,
        })
     axios({
        method: 'get',
        url: basepath + 'project/getProjectByIds/' + localStorage.getItem('projectId')+'?stage=2',
        }).then((response) => {
        console.log("about design response",response.data)
        var _response=response.data;
      //  console.log('get about design****', response.data);
        var _tempUserPropsal=response.data.userProposal;
        //designServices  designObjective
        this.setState({
            platforms: (_response.platform !=null || _response.platform.length>0)?_response.platform:[],
            services:_tempUserPropsal.designServices,
            objective:_tempUserPropsal.designObjective,
            addLink:(_tempUserPropsal.referenceLink.length>0 || _tempUserPropsal.referenceLink!=null)?_tempUserPropsal.referenceLink:[],
            loading:false,
           })

      }).catch((error) => {
        console.log('get project error stage 2', error.response);
        this.setState({
            loading:false,
        })
    });
}


}

    renderClass = () => {
        if (this.state.platforms.length > 0
            && this.state.services
            && this.state.objective
            && (this.state.document || this.state.addLink.length > 0)) {
            return "Rectangle-4"
        }
    else{
        return "button-block-class"
    }
}
setStateMethod=(label,value)=>{
    this.setState({
        [label]:value,
        edit:false,
    });
}
goTo=()=>{
    console.log("platform--->",this.state.platforms)
    if(this.state.platforms.length==0){
        alert("called")
        this.setStateMethod('platformClass',true)
    }
    else if(!this.state.services){
        this.setStateMethod('servicesClass',true)
    
    }
    else if(!this.state.objective){
        this.setStateMethod('objectiveClass',true)
    }
    else if(!this.state.addLink[0]){
        this.setStateMethod('linkClass',true)
    }
    else{
        if(this.state.document==''){
            let list=this.state.addLink;
            this.postAboutDesignData(list)
            // this.state.addLink.push(this.state.document);
            // this.setState({addLink:this.state.addLink});
        }
        else if(validateUrl(this.state.document)){
              let list=this.state.addLink;
              list=list.concat(this.state.document);
              this.postAboutDesignData(list);
           }
      
     }
        console.log('ddddddd',this.state.servicesClass)
}
postAboutDesignData=(link_list)=>{
    axios({
        method:'put',
        url:basepath+'project/updateProjectFromWorkspace',
        data:{
            platform:this.state.platforms,
            designServices:this.state.services,
            designObjective:this.state.objective,
            referenceLink:link_list,
            projectId:localStorage.getItem('projectId'),
        },
    })
    .then((resp)=>{
        this.setState({
            edit:true,
        })
        this.props.openPanel()
        console.log("about design---------->",resp);
    })
    .catch((err)=>{
        console.log("about design  error",err)
    })
}

    render() {
        if (this.state.loading) {
            return <div>loading</div>
        }
        else return (
            <div>
                <div className="input-spacing platform-selection">
                    {/********************* Select Multiple *****  */}

                    <SelectMultiple
                        width='100%'
                        placeholder="Platforms to design"
                        handleRemoval={() => { this.setStateMethod('edit', false) }}
                        defaultValue={this.state.platforms}
                        optionList={this.state.platformList}
                        error={this.state.platformClass}
                        onclick={(value, key) => {
                            console.log('---------------', value)
                            this.state.platforms.push(value);
                            this.setStateMethod('platforms', this.state.platforms)
                        }} />
                </div>
                {/* ***************** selection dsign service  ***** */}
                <div className="input-spacing">
                    <Selection
                        defaultValue={this.state.services}
                        value={this.state.services}
                        onChange={(e) => { this.handleButtonClick(e) }}
                        placeholder="Design Services"
                        optionList={this.state.designList}
                        error={this.state.productTypeClass}
                        onclick={(value, key) => {
                            this.setState({
                                edit: false,
                                services: value,
                            });
                        }
                        }
                    />
                </div>
                {/* ***************** selection Design Objective  ***** */}
                <div className="input-spacing">
                    <Selection
                        defaultValue={this.state.objective}
                        value={this.state.objective}
                        // onChange={(e) => { this.handleButtonClick(e) }}    
                        placeholder="Design Objective"
                        optionList={this.state.objectiveList}
                        error={this.state.productTypeClass}
                        onclick={(value, key) => {
                            this.setState({
                                edit:false,
                                objective: value
                            });
                        }
                        }
                    />
                </div>
                {/* <AddLink
                
                error={this.state.scopeDocumentClass}
                placeholder="Link(s) to scope document, if any"
                onclick={(e) => {
                    
                    this.setStateMethod('document', e.target.value)
                }}
                addAnotherLink={(e) => {
                    let list = this.state.scopeDocument;
                    list = list.concat(this.state.document);
                    this.setStateMethod('scopeDocument', list)
                    this.setStateMethod('document', '')
                    this.setStateMethod('scopeDocumentClass', false)
                }} /> */}
                <AddLink
                    defaultValue={this.state.addLink}
                    error={this.state.linkClass}
                    placeholder='Link(s) to references (apps/sites you like)'
                    onclick={(e) => {
                        this.setStateMethod('document', e.target.value)
                    }}
                    addAnotherLink={(e) => {
                        let list = this.state.addLink;
                        list = list.concat(this.state.document);
                        this.setStateMethod('addLink', list)
                        this.setStateMethod('document', '')
                        this.setStateMethod('linkClass', false)
                    }} />

                <button
                    disabled={this.state.edit}
                    onClick={() => this.goTo()}
                    className={this.renderClass()}>
                    <span className="button-title">
                        <span>NEXT</span>
                        <span><img src={require('../Images/arrow-down.svg')} /></span>
                    </span>

                    {/* <span className="button-title">DONE<span style={{marginLeft:'42px'}}><img  width='18px'height='16px' src={require('../Images/invalid-name.png')}/>  </span></span> */}
                </button>
            </div>
        )
    }
}
