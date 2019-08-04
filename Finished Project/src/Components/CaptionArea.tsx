import { IconButton } from '@material-ui/core';
import InputAdornment from '@material-ui/core/InputAdornment';
import TextField from '@material-ui/core/TextField'
import Search from '@material-ui/icons/Search'
import * as React from 'react'
import MediaStreamRecorder from 'msr';

interface IState {
    input: string,
    result: any,
    body:any,
}

interface IProps {
    currentVideo:any,
    play: any
}

export default class CaptionArea extends React.Component<IProps, IState>{
    public constructor(props: any) {
        super(props);
        this.state = {
            body: [],
            input: "",
            result: [],
        }
    }

    public postAudio = (blob:any) => {
        fetch('https://westus.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US', {
            body: blob, // this is a .wav audio file    
            headers: {
                'Accept': 'application/json',
                'Authorization': 'Bearer' + window.localStorage.getItem("key"),
                'Content-Type': 'audio/wav;codec=audio/pcm; samplerate=16000',
                'Ocp-Apim-Subscription-Key': '7adbab792b34492ab4b0e6ba3886c66e'
            },    
            method: 'POST'
        }).then((res) => {
            console.log(res)
            return res.json()
        }).then((res: any) => {
            console.log(res.DisplayText)
            this.setState({input:res.DisplayText})
            this.search()
        }).catch((error) => {
            console.log("Error", error)
        });
    }
        

    public search = () => {
        if(this.state.input.trim() === ""){
            this.setState({result:[]},()=>this.makeTableBody())
        }else{
            fetch("https://scriberapi.azurewebsites.net/api/Videos/SearchByTranscriptions/"+this.state.input, {
                headers: {
                  Accept: "text/plain"
                },
                method:"GET"
            }).then(response => {
                return response.json()
            }).then(answer => {
                this.setState({result:answer},()=>this.makeTableBody())
                
            })
        }
    }

    public handleTableClick = (videoUrl:any, timedURL: string) => {
        window.scrollTo(0,0);
        this.props.play(videoUrl + "&t=" + timedURL + "s")
    }

    public searchTagByVoice =() =>{

        const mediaConstraints = {
            audio: true
    };
    
    const onMediaSuccess = (stream: any) => {
        
        const mediaRecorder = new MediaStreamRecorder(stream);
        mediaRecorder.mimeType = 'audio/wav'; // check this line for audio/wav
        mediaRecorder.ondataavailable = (blob: any) => {
         this.postAudio(blob);
            mediaRecorder.stop()
        }
        mediaRecorder.start(3000);
    }

    function onMediaError(e: any) {
        console.error('media error', e);
    }
    
    fetch('https://westus.api.cognitive.microsoft.com/sts/v1.0/issueToken', {
        headers: {
            'Content-Length': '0',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Ocp-Apim-Subscription-Key': '7adbab792b34492ab4b0e6ba3886c66e'
        },
        method: 'POST'
        
    }).then((response) => {
        return response.text()
    }).then((response) => {
        window.localStorage.setItem("Key", response)

        
    }).catch((error) => {
        console.log("Error", error)
    });



    navigator.getUserMedia(mediaConstraints, onMediaSuccess, onMediaError)

    
    }




    public makeTableBody = () => {
        const toRet: any[] = [];
        this.state.result.sort((a:any, b:any)=>{
            if(a.webUrl === b.webUrl){
                return 0;
            }else if(a.webUrl === this.props.currentVideo){
                return -1;
            }else if(b.webUrl === this.props.currentVideo){
                return 1;
            }
            else{
                return a.videoTitle.localeCompare(b.videoTitle);
            }
        })
        this.state.result.forEach((video: any) => {
            video.transcription.forEach((caption: any) => {
                toRet.push(
                    <tr onClick={() => this.handleTableClick(video.webUrl,caption.startTime)}>
                        <td>{caption.startTime}</td>
                        <td>{caption.phrase}</td>
                        <td>{video.videoTitle}</td>
                    </tr>)
            })
        });
        if (toRet.length === 0) {
            if(this.state.input.trim() === ""){
                const errorCase = <div><p>Sorry you need to still search</p></div>
                this.setState({body:errorCase})
            }else{
                const errorCase = <div><p>Sorry no results were returned for "{this.state.input}"</p></div>
                this.setState({body:errorCase})
            }
        }
        else{
            this.setState({body:toRet})
        }
    }

    public render() {
        return (
            <div className="caption-area">
                <div className="row">
                    <div className="col-2 justify-content-center align-self-center">
                        <h1><span className="red-heading">searcsssh</span>caption</h1>
                    </div>
                    <div className="col-10">
                        
                        <TextField
                            id="Search-Bar"
                            className="SearchBar"
                            placeholder="Search Captions"
                            margin="normal"
                            variant="outlined"
                            onChange={(event: any) => this.setState({ input: event.target.value })}
                            value={this.state.input}
                            InputProps={{
                                endAdornment: <InputAdornment position="end">
                                    <IconButton onClick={() => this.search()}>

                                        <Search />
                                    </IconButton>
                                    <div className="btn" onClick={this.searchTagByVoice}><i className="fa fa-microphone" /></div>
                                </InputAdornment>
                            }}
                        />
                    </div>
                </div>
                <br />
                <table className="table">
                    <tr>
                        <th>Time</th>
                        <th>Caption</th>
                        <th>Video</th>
                    </tr>
                    <tbody className="captionTable">
                        {this.state.body}
                    </tbody>
                </table>
            </div>
        )
    }
}
