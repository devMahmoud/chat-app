const $messageForm = document.querySelector('#message-form')
const $sendMessageButton = document.querySelector('#sendMessage')
const $messageInputText = document.getElementById('message')
const $sendLocationButton = document.querySelector('#shareLocation')
const $messages = document.querySelector('#messages')

const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML

const socket = io()

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild
    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    // Visible height
    const visibleHeight = $messages.offsetHeight
    // Height of messages container
    const containerHeight = $messages.scrollHeight
    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight
    if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight
    }
    console.log(`scrollOffset: ${scrollOffset}\n
    newMessageHeight: ${newMessageHeight}\n
    visibleHeight: ${visibleHeight}\n
    containerHeight: ${containerHeight}`)
}

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    $sendMessageButton.setAttribute('disabled', 'disabled')
    const message = $messageInputText.value
    $messageInputText.value = ''
    $messageInputText.focus()
    socket.emit('sendMessage', message, (error) => {
        $sendMessageButton.removeAttribute('disabled')
        if(error){
            return console.log(error)
        }
        console.log('The message was delivered!')
    })
})

$sendLocationButton.addEventListener('click', (e) => {
    e.preventDefault()
    if(!navigator.geolocation){
        return alert("Your browser doesn't support geolocation")
    }

    $sendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        const location = {
        lat : position.coords.latitude,
        long : position.coords.longitude
        }
        socket.emit('sendLocation', location, () => {
            console.log('Location shared successfully')
            $sendLocationButton.removeAttribute('disabled')
        })
    })
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

socket.on('message', (message) => {
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (message) => {
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.emit('join', { username, room }, (error) => {
    if(error){
        alert(error)
        location.href = '/'
    }
})