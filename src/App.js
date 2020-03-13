import React, { Component } from 'react'
import './css/App.css'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.min.css'
import projects from './PunchHistory.json'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCog } from '@fortawesome/free-solid-svg-icons'
import PieChart from 'react-minimal-pie-chart';

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      projects: projects,
      currentProjectSelectedIndex: 0,
      clockedIn: false,
      currentlyPaused: false,
      timerRunning: false,
    }
  }

  componentDidMount() {
    toast.configure()
  }

  changeProjectHandler = (index) => {
    if (index !== this.state.currentProjectSelectedIndex) {
      let projects = this.state.projects
      if (projects[index].clockedIn) {
        this.setState({ clockedIn: true })
        if (!projects[index].paused) {
          this.setState({ currentlyPaused: false })
          this.getCurrentPunchSecondsHandler(index)
          if (!this.state.timerRunning) {
            this.startTimerHandler()
          }
        } else {
          this.setState({ currentlyPaused: true })
          this.pauseTimerHandler()
        }
      } else {
        this.setState({ clockedIn: false, currentlyPaused: false })
        this.pauseTimerHandler()
      }
      this.setState({ currentProjectSelectedIndex: index, projects: projects })
    }
  }

  getCurrentPunchSecondsHandler = (index) => {
    let latestPunch = this.state.projects[index].punchHistory.length - 1
    let project = this.state.projects
    let milliseconds = Date.now() - project[index].punchHistory[latestPunch].clockInTimeInMS
    project[index].currentSeconds = Math.floor(milliseconds / 1000) + project[index].timeAdjusted
    this.setState({ projects: project })
  }

  addProjectHandler = () => {
    let newProject = {
      name: 'New Project',
      projectID: this.state.projects.length,
      paused: false,
      currentSeconds: 0,
      timeAdjusted: 0,
      totalSeconds: 0,
      timeClockedIn: "",
      clockedIn: false,
      punchHistory: [],
    }
    this.createProjectHandler(newProject)
  }

  createProjectHandler = (newProject) => {
    let currentProjects = this.state.projects
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
      this.addNewPunchHandler()
      this.setState({ projects: project, clockedIn: true })
    }
  }

  clockOutHandler = () => {
    this.pauseTimerHandler()
    let project = this.state.projects
    let index = this.state.currentProjectSelectedIndex
    let latestPunch = project[index].punchHistory.length - 1
    project[index].clockedIn = false
    project[index].paused = false
    project[index].totalSeconds += project[index].currentSeconds
    project[index].punchHistory[latestPunch].totalSeconds = project[index].currentSeconds
    project[index].currentSeconds = 0
    project[index].punchHistory[latestPunch].punchOut = this.getTimeHandler()
    project[index].punchHistory[latestPunch].clockedOut = true
    project[index].punchHistory[latestPunch].timeAdjusted = project[index].timeAdjusted
    project[index].timeAdjusted = 0
    this.setState({ projects: project, clockedIn: false, currentlyPaused: false })
  }

  getTimeHandler = () => {
    let time = new Date()
    let hours = time.getHours()
    let minutes = time.getMinutes() >= 10 ? time.getMinutes() : '0' + time.getMinutes()
    return `${hours >= 12 ? hours - 12 : hours}:${minutes} ${hours >= 12 ? 'PM' : 'AM'}`
  }

  getDateHandler = () => {
    var today = new Date()
    var dd = String(today.getDate()).padStart(2, '0')
    var mm = String(today.getMonth() + 1).padStart(2, '0')
    var yyyy = today.getFullYear()

    today = mm + '/' + dd + '/' + yyyy
    return today
  }

  addNewPunchHandler = () => {
    let project = this.state.projects
    let newPunch = {
      date: this.getDateHandler(),
      punchIn: this.getTimeHandler(),
      punchOut: 0,
      totalSeconds: 0,
      clockedOut: false,
      clockInTimeInMS: Date.now(),
      timeAdjusted: 0,
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
    this.setState({ timerRunning: true })
  }

  pauseTimerHandler = () => {
    clearInterval(this.incrementer)
    this.setState({ timerRunning: false })
  }

  pauseClockHandler = (index) => {
    if (this.state.clockedIn) {
      let projects = this.state.projects
      projects[index].paused = true
      this.setState({ projects: projects, currentlyPaused: true })
      this.pauseTimerHandler()
    } else {
      toast.error('What is it you\'re hoping to pause, exactly?')
    }
  }

  resumeClockHandler = (index) => {
    let projects = this.state.projects
    projects[index].paused = false
    this.setState({ projects: projects, currentlyPaused: false })
    this.startTimerHandler()
  }

  getSeconds = () => {
    if (this.state.projects[this.state.currentProjectSelectedIndex].punchHistory.length !== 0) {
      return ('0' + this.state.projects[this.state.currentProjectSelectedIndex].currentSeconds % 60).slice(-2)
    } else {
      return '00'
    }
  }

  getMinutes = () => {
    if (this.state.projects[this.state.currentProjectSelectedIndex].punchHistory.length !== 0) {
      return ('0' + Math.floor(this.state.projects[this.state.currentProjectSelectedIndex].currentSeconds / 60) % 60).slice(-2)
    } else {
      return '00'
    }
  }

  getHours = () => {
    if (this.state.projects[this.state.currentProjectSelectedIndex].punchHistory.length !== 0) {
      return ('0' + Math.floor(this.state.projects[this.state.currentProjectSelectedIndex].currentSeconds / 3600)).slice(-2)
    } else {
      return '00'
    }
  }

  getTotalProjectTime = (value) => {
    return ('0' + Math.floor(value.totalSeconds / 3600)).slice(-2) + ':' + ('0' + Math.floor(value.totalSeconds / 60) % 60).slice(-2)
  }

  formatTimeFromSecondsHandler = (seconds) => {
    return ('0' + Math.floor(seconds / 3600)).slice(-2) + ':' + ('0' + Math.floor(seconds / 60) % 60).slice(-2) + ':' + ('0' + Math.floor(seconds) % 60).slice(-2)
  }

  clockInOutHandler = () => {
    if (this.state.projects[this.state.currentProjectSelectedIndex].punchHistory.length !== 0) {
      if (!this.state.projects[this.state.currentProjectSelectedIndex].punchHistory[this.state.projects[this.state.currentProjectSelectedIndex].punchHistory.length - 1].clockedOut) {
        this.clockOutHandler()
      } else {
        this.clockInHandler()
      }
    } else {
      this.clockInHandler()
    }
  }

  changeProjectInfoHandler = (e, index, infoType) => {
    let project = this.state.projects
    if (infoType === 'name') {
      project[index].name = e.target.value
      this.setState({ projects: project })
    } else if (infoType === 'removeProject') {
      let newProjects = project.slice(0, index).concat(project.slice(index + 1, project.length))
      if (index === project.length) {
        this.changeProjectHandler(index - 1)
      } else {
        this.changeProjectHandler(index + 1)
      }
      this.setState({ projects: newProjects })
    }
  }

  modifyTimerHandler = (time) => {
    if (this.state.clockedIn) {
      let project = this.state.projects
      if (project[this.state.currentProjectSelectedIndex].currentSeconds + time < 0) {
        project[this.state.currentProjectSelectedIndex].timeAdjusted -= project[this.state.currentProjectSelectedIndex].currentSeconds
        project[this.state.currentProjectSelectedIndex].currentSeconds = 0
      } else {
        project[this.state.currentProjectSelectedIndex].currentSeconds += time
        project[this.state.currentProjectSelectedIndex].timeAdjusted += time
      }
      this.setState({ projects: project })
    } else {
      toast.error('Maybe clock in?..')
    }
  }

  render() {
    return (
      <div className='applicationContainer'>
        <div className='projectsContainer'>
          {this.state.projects.map((value, index) => (
            <Project
              value={value}
              index={index}
              getTotalProjectTime={this.getTotalProjectTime}
              projectSettingsButtonHandler={this.projectSettingsButtonHandler}
              currentProjectSelectedIndex={this.state.currentProjectSelectedIndex}
              changeProjectHandler={this.changeProjectHandler}
              key={index}
              changeProjectInfoHandler={this.changeProjectInfoHandler}
            />
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
            <button className='clockInOutButton' onMouseDown={this.clockInOutHandler}>{this.state.clockedIn ? 'Clock Out' : 'Clock In'}</button>
            <div className='modifyTimerContainer'>
              <button className='modifyTimerButton' onMouseDown={() => this.modifyTimerHandler(1)}>+1</button>
              <button className='modifyTimerButton' onMouseDown={() => this.modifyTimerHandler(10)}>+10</button>
              <button className='modifyTimerButton' onMouseDown={() => this.modifyTimerHandler(60)}>+60</button>
              <button className='modifyTimerButton' onMouseDown={() => this.modifyTimerHandler(-1)}>-1</button>
              <button className='modifyTimerButton' onMouseDown={() => this.modifyTimerHandler(-10)}>-10</button>
              <button className='modifyTimerButton' onMouseDown={() => this.modifyTimerHandler(-60)}>-60</button>
            </div>
            <button className='pausePlayTimerButton' onMouseDown={this.state.currentlyPaused ? () => this.resumeClockHandler(this.state.currentProjectSelectedIndex) : () => this.pauseClockHandler(this.state.currentProjectSelectedIndex)}>{this.state.currentlyPaused ? 'Resume' : 'Pause'}</button>
          </div>
        </div>
        <div className='projectDetailsContainer'>
          {this.state.currentProjectSelectedIndex !== -1 && this.state.projects[this.state.currentProjectSelectedIndex].punchHistory.length > 0 ? this.state.projects[this.state.currentProjectSelectedIndex].punchHistory.map((value, index) => (
            <Punch
              value={value}
              index={index}
              key={index}
              formatTimeFromSecondsHandler={this.formatTimeFromSecondsHandler}
              currentProjectDetails={this.state.projects[this.state.currentProjectSelectedIndex]}
              formatTimeFromSecondsHandler={this.formatTimeFromSecondsHandler}
            />
          )) :
            this.state.currentProjectSelectedIndex !== -1 && this.state.projects[this.state.currentProjectSelectedIndex].punchHistory ?
              <p style={{ marginLeft: '15px' }}>No previous punches recorded. Clock in to create one</p>
              :
              <p>Select a project!</p>
          }
        </div>
      </div>
    );
  }
}

class Project extends Component {
  constructor(props) {
    super(props)
    this.state = {
      displaySettings: false,
    }
  }

  projectSettingsButtonHandler = (project, e) => {
    e.stopPropagation()
    this.setState({ displaySettings: !this.state.displaySettings })
  }

  SettingsBanner = (props) => {
    if (props.displaySettings) {
      return (
        <div className='projectSettingsContainer'>
          <p style={{ marginLeft: '15px' }}>Project Name: </p>
          <input type='text' value={props.value.name} onChange={(e) => { props.changeProjectInfoHandler(e, props.value.projectID, 'name') }} className='projectInput'></input>
          <button style={{ marginLeft: '15px' }} className='removeProjectButton' onMouseDown={(e) => props.changeProjectInfoHandler(e, props.value.projectID, 'removeProject')}>Remove Project</button>
        </div>
      )
    } else {
      return (
        <div className='projectSettingsContainer closedProjectSettings'>

        </div>
      )
    }
  }

  render() {
    return (
      <div className={`projectPreviewContainer ${this.props.currentProjectSelectedIndex === this.props.index ? 'projectPreviewSelected' : ''}`} onMouseDown={() => this.props.changeProjectHandler(this.props.index)}>
        <button className='projectSettingsButton' style={this.props.value.clockedIn ? { color: 'white' } : {}} onMouseDown={(e) => this.projectSettingsButtonHandler(this.props.value, e)}><FontAwesomeIcon icon={faCog} /></button>
        <p className='interfaceText' style={{ justifySelf: 'start', marginLeft: '15px' }}>{this.props.value.name}</p>
        <p className='interfaceText'>Current Hours: {this.props.getTotalProjectTime(this.props.value)}</p>
        <this.SettingsBanner displaySettings={this.state.displaySettings} value={this.props.value} changeProjectInfoHandler={this.props.changeProjectInfoHandler} />
      </div>
    )
  }
}

class Punch extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showDetails: false,
    }
  }

  displayDetailsHandler = () => {
    this.setState({ showDetails: !this.state.showDetails })
  }

  PunchDetailsContainer = (props) => {
    let adjustedSeconds = props.value.clockedOut ? props.value.timeAdjusted : props.projectDetails.timeAdjusted
    if (props.showDetails) {
      return (
        <div className='punchDetailsContainer'>
          <p className='interfaceText'>Clocked In Status: {!props.value.clockedOut ? 'true' : 'false'}</p>
          <PieChart
            animate={true}
            animationDuration={500}
            animationEasing="ease-out"
            cx={50}
            cy={50}
            data={[
              {
                color: '#0F3B2A',
                title: 'Total Time Unadjusted',
                value: props.value.clockedOut ? props.value.totalSeconds - props.value.timeAdjusted : props.projectDetails.currentSeconds - props.projectDetails.timeAdjusted
              },
              {
                color: '#2FBA85',
                title: 'Total Time Adjusted',
                value: adjustedSeconds
              },
              {
                color: '#1B6E4E',
                title: 'Total Seconds',
                value: props.value.clockedOut ? props.value.totalSeconds : props.projectDetails.currentSeconds
              }
            ]}
            label={false}
            labelPosition={50}
            lengthAngle={360}
            lineWidth={100}
            onClick={undefined}
            onMouseOut={undefined}
            onMouseOver={undefined}
            paddingAngle={0}
            radius={50}
            rounded={false}
            startAngle={0}
            style={{
              height: '100px'
            }}
          />
          <p className='interfaceText'>Total time adjusted: {adjustedSeconds < 0 ? '-' : ''}{props.formatTimeFromSecondsHandler(adjustedSeconds < 0 ? Math.abs(adjustedSeconds) : adjustedSeconds)}</p>
          <p className='interfaceText'>Total time unadjusted: {props.formatTimeFromSecondsHandler(props.value.clockedOut ? props.value.totalSeconds - props.value.timeAdjusted : props.projectDetails.currentSeconds - props.projectDetails.timeAdjusted)}</p>
        </div>
      )
    } else {
      return (
        <div className='punchDetailsContainer closedProjectSettings' >

        </div>
      )
    }

  }

  render() {
    return (
      <div className='projectPunchDetailsContainer'>
        <p className='interfaceText'>Date: {this.props.value.date}</p>
        <p className='interfaceText'>Punch in time: {this.props.value.punchIn}</p>
        <p className='interfaceText'>Punch out time: {this.props.value.punchOut}</p>
        <p className='interfaceText'>Total billable time: {this.props.formatTimeFromSecondsHandler(this.props.value.clockedOut ? this.props.value.totalSeconds : this.props.currentProjectDetails.currentSeconds)}</p>
        <span className={`openPunchDetailsLine1 ${this.state.showDetails ? 'punchDetailsLineRotated' : ''}`} />
        <span className={`openPunchDetailsLine2 ${this.state.showDetails ? 'punchDetailsLineRotated' : ''}`} />
        <span className='openPunchDetailsContainer' onMouseDown={() => this.displayDetailsHandler()} />
        <this.PunchDetailsContainer showDetails={this.state.showDetails} projectDetails={this.props.currentProjectDetails} value={this.props.value} index={this.props.index} formatTimeFromSecondsHandler={this.props.formatTimeFromSecondsHandler} />
      </div>
    )
  }
}

export default App;
