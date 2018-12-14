import React, {Component} from 'react';
import './App.css';
import Navigation from './components/Navigation/Navigation'
import Logo from './components/Logo/Logo';
import ImageLinkForm from './components/ImageLinkForm/ImageLinkForm';
import Rank from './components/Rank/Rank';
import FaceRecognition from './components/FaceRecognition/FaceRecognition';
import SignIn from './components/SignIn/SignIn';
import Register from './components/Register/Register';
import Particles from 'react-particles-js';

// Heroku
const URL = process.env.BACKEND_URL;

const particlesConfig = {
    particles: {
        number: {
            value: 30,
            density: {
                enable: true,
                value_area: 100
            }
        }
    }
};

const initialState = {
    imageUrl: '',
    input: '',
    box: {},
    route: 'signin',
    isSignedIn: false,
    user: {
        id: '',
        name: '',
        email: '',
        entries: 0,
        joined: ''
    }
}

class App extends Component {

    constructor() {
        super();
        this.state = initialState
    }

    loadUserInMain = (data) => {
        this.setState({
            user: {
                id: data.id,
                name: data.name,
                email: data.email,
                entries: data.entries,
                joined: data.joined
            }
        })
    }


    calculateFaceLocation = (data) => {
        // data.outputs -> array of bounding boxes
        // bounding box is specified as percentage of the image
        // we only select the first face
        const faceDetected = data.outputs[0].data.regions[0].region_info.bounding_box;
        const image = document.getElementById('inputImage');
        const width = Number(image.width);
        const height = Number(image.height);

        return {
            leftCol: faceDetected.left_col * width,
            topRow: faceDetected.top_row * height,
            rightCol: width - (faceDetected.right_col * width),
            bottomRow: height - (faceDetected.bottom_row * height),
        };
    };

    displayBoundedBox = (box) => {
        this.setState({box: box})
    };

    onInputChange = (event) => {
        this.setState({input: event.target.value});
    };

    onPictureSubmit = () => {
        this.setState({imageUrl: this.state.input});

        // handle API call on backend, hide the API key
        fetch(URL + '/imageurl', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                input: this.state.input
            })
        })
            .then(response => response.json())
            .then((response) => {
                // update picture counts
                if (response) {
                    fetch(URL + '/image', {
                        method: 'put',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            id: this.state.user.id
                        })
                    })
                        .then(response => response.json())
                        .then(count => {
                            // update the entries in the View Layer
                            this.setState(
                                // change ONLY entries, not the whole USER object
                                // then it returns the object
                                Object.assign(
                                    this.state.user,
                                    {
                                        entries: count
                                    })
                            )
                        })
                        .catch(console.log)
                }
                return this.calculateFaceLocation(response)
            })
            .then(box => {
                this.displayBoundedBox(box)
            })
            .catch(err => console.log(err));

    };

    onRouteChange = (route) => {

        if (route === 'signout') {
            this.setState(initialState);
        } else if (route === 'home') {
            this.setState({isSignedIn: true});
        }

        this.setState({route: route});
    };

    render() {

        const {isSignedIn, imageUrl, route, box} = this.state;

        return (
            <div className="App">
                <Particles
                    params={particlesConfig}
                    className="particles"/>
                <Navigation isSignedIn={isSignedIn} onRouteChange={this.onRouteChange}/>
                {/*route='home' -> show HomePage*/}
                {(route === 'home')
                    ? <div>
                        <Logo/>
                        <Rank
                            name={this.state.user.name}
                            entries={this.state.user.entries}/>
                        <ImageLinkForm
                            onInputChange={this.onInputChange}
                            onButtonSubmit={this.onPictureSubmit}
                        />
                        <FaceRecognition box={box} imgUrl={imageUrl}/>
                    </div>
                    : (
                        (route === 'signin')
                            ? <SignIn onRouteChange={this.onRouteChange}
                                      loadUserInMain={this.loadUserInMain}/>
                            : <Register onRouteChange={this.onRouteChange}
                                        loadUserInMain={this.loadUserInMain}/>
                    )

                }

            </div>
        );
    }
}

export default App;
