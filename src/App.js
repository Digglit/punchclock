import React, { Component } from 'react'
import './App.css'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.min.css'
import projects from './PunchHistory.json'

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      projects: projects,
      currentProjectSelectedIndex: 0,
      currentProjectSelectedDetails: {},
    }
  }

  componentDidMount() {
    toast.configure()
  }

  changeProjectHandler = (index) => {
    let projects = this.state.projects
    let projectDetails = projects[index]
    this.setState({ currentProjectSelectedDetails: projectDetails, currentProjectSelectedIndex: index })
  }

  addProjectHandler = () => {
    let newProject = {
      name: 'New Project',
      currentTime: 0,
      punchHistory: [],
    }
    this.createProjectHandler(newProject)
  }

  createProjectHandler = (newProject) => {
    let currentProjects = [...this.state.projects]
    currentProjects.push(newProject)
    this.setState({ projects: currentProjects })
  }

  clockInHandler = () => {
    if (this.state.currentProjectSelectedIndex === -1) {
      toast.error('Select a project before clocking in')
    } else {
      this.startTimerHandler()
      let project = this.state.projects
      project[this.state.currentProjectSelectedIndex].clockedIn = true
      project[this.state.currentProjectSelectedIndex].paused = false
      project[this.state.currentProjectSelectedIndex].timeClockedIn = this.getTimeHandler()
      this.setState({ projects: project })
    }
  }

  getTimeHandler = () => {
    let time = new Date()
    let hours = time.getHours()
    let minutes = time.getMinutes() >= 10 ? time.getMinutes() : '0' + time.getMinutes()
    return `${hours >= 12 ? hours - 12 : hours}:${minutes} ${hours >= 12 ? 'PM' : 'AM'}`
  }

  getDateHandler = () => {
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy = today.getFullYear();

    today = mm + '/' + dd + '/' + yyyy;
    return today
  }

  clockOutHandler = () => {
    this.pauseTimerHandler()
    this.addNewPunchHandler()
    let project = this.state.projects
    project[this.state.currentProjectSelectedIndex].clockedIn = false
    project[this.state.currentProjectSelectedIndex].paused = false
    project[this.state.currentProjectSelectedIndex].totalSeconds += project[this.state.currentProjectSelectedIndex].currentSeconds
    project[this.state.currentProjectSelectedIndex].currentSeconds = 0
    this.setState({ projects: project })
  }

  addNewPunchHandler = () => {
    let project = this.state.projects
    let newPunch = {
      date: this.getDateHandler(),
      punchIn: project[this.state.currentProjectSelectedIndex].timeClockedIn,
      punchOut: this.getTimeHandler(),
      totalBillable: this.calculateTotalBillable()
    }
    if (project[this.state.currentProjectSelectedIndex].punchHistory) {
      project[this.state.currentProjectSelectedIndex].punchHistory.push(newPunch)
    } else {
      project[this.state.currentProjectSelectedIndex].punchHistory = [newPunch]
    }
    this.setState({ projects: project })
  }

  calculateTotalBillable = () => {
    let project = this.state.projects
    const minutes = ('0' + Math.floor(project[this.state.currentProjectSelectedIndex].currentSeconds / 60) % 60).slice(-2)
    const hours = ('0' + Math.floor(project[this.state.currentProjectSelectedIndex].currentSeconds / 3600)).slice(-2)
    return `${hours} hours, ${minutes} minutes`
  }

  startTimerHandler = () => {
    let _this = this
    let project = this.state.projects
    this.incrementer = setInterval(() => {
      project[this.state.currentProjectSelectedIndex].currentSeconds += 1
      _this.setState({ projects: project })
    }, 1000)
  }

  pauseTimerHandler = () => {
    clearInterval(this.incrementer)
  }

  pauseClockHandler = () => {
    this.setState({ currentlyPaused: true })
    this.pauseTimerHandler()
  }

  resumeClockHandler = () => {
    if (this.state.clockedIn) {
      this.setState({ currentlyPaused: false })
      this.startTimerHandler()
    }
  }

  getSeconds = () => {
    if (this.state.currentProjectSelectedIndex !== -1) {
      return ('0' + this.state.projects[this.state.currentProjectSelectedIndex].currentSeconds % 60).slice(-2)
    } else {
      return '00'
    }
  }

  getMinutes = () => {
    if (this.state.currentProjectSelectedIndex !== -1) {
      return ('0' + Math.floor(this.state.projects[this.state.currentProjectSelectedIndex].currentSeconds / 60) % 60).slice(-2)
    } else {
      return '00'
    }
  }

  getHours = () => {
    if (this.state.currentProjectSelectedIndex !== -1) {
      return ('0' + Math.floor(this.state.projects[this.state.currentProjectSelectedIndex].currentSeconds / 3600)).slice(-2)
    } else {
      return '00'
    }
  }

  getTotalProjectTime = (value) => {
    return ('0' + Math.floor(value.totalSeconds / 3600)).slice(-2) + ':' + ('0' + Math.floor(value.totalSeconds / 60) % 60).slice(-2)
  }

  render() {
    return (
      <div className='applicationContainer'>
        <div className='projectsContainer'>
          {this.state.projects.map((value, index) => (
            <div className={`projectPreviewContainer ${this.state.currentProjectSelectedIndex === index ? 'projectPreviewSelected' : ''}`} onMouseDown={() => this.changeProjectHandler(index)}>
              <p className='interfaceText' style={{ justifySelf: 'start', marginLeft: '15px' }}>{value.name}</p>
              <p className='interfaceText'>Current Hours: {this.getTotalProjectTime(value)}</p>
            </div>
          ))}
          <div className='projectPreviewContainer' onMouseDown={this.addProjectHandler}>
            <p className='interfaceText' style={{ justifySelf: 'start', marginLeft: '15px' }}>+ Add Project</p>
          </div>
        </div>
        <div className='projectClockDisplayContainer'>
          <div className='clockContainer'>
            <div className='clockTimerContainer'>
              <p className='clockTimer'>{this.getHours()}:{this.getMinutes()}:{this.getSeconds()}</p>
            </div>
            <button className='clockInOutButton' onMouseDown={this.state.projects[this.state.currentProjectSelectedIndex].clockedIn ? this.clockOutHandler : this.clockInHandler}>{this.state.projects[this.state.currentProjectSelectedIndex].clockedIn ? 'Clock Out' : 'Clock In'}</button>
            <button className='pausePlayTimerButton' onMouseDown={this.state.currentlyPaused ? this.resumeClockHandler : this.pauseClockHandler}>{this.state.currentlyPaused ? 'Resume' : 'Pause'}</button>
          </div>
        </div>
        <div className='projectDetailsContainer'>
          {this.state.currentProjectSelectedIndex !== -1 && this.state.projects[this.state.currentProjectSelectedIndex].punchHistory.length > 0 ? this.state.projects[this.state.currentProjectSelectedIndex].punchHistory.map((value, index) => (
            <div className='projectPunchDetailsContainer'>
              <p className='interfaceText'>Date: {value.date}</p>
              <p className='interfaceText'>Punch in time: {value.punchIn}</p>
              <p className='interfaceText'>Punch out time: {value.punchOut}</p>
              <p className='interfaceText'>Total billable time: {value.totalBillable}</p>
            </div>
          )) :
            this.state.currentProjectSelectedIndex !== -1 && this.state.projects[this.state.currentProjectSelectedIndex].punchHistory ?
              <p>No previous punches recorded. Clock in to create one</p>
              :
              <p>Select a project!</p>
          }
        </div>
      </div>
    );
  }
}

export default App;
