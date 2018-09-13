let UI = {
    btn: {
        search: $("#btnSearch"),
        sendWebReminder: $("#btnReminderWeb"),
        sendMailReminder: $("#btnReminderMail"),
        showMailReminder: $("#btnShowReminderMail"),
        cancelReminder: $("#reminderCancel"),
    },
    input: {
        date: $("#date"),
        time: $("#time"),
        origin: $("#inputOrigin"),
        destination: $("#inputDestination"),
        tripIndex: $("#tripIndex"),
        email: $("#inputReminderEmail"),
        minutes: $("#inputReminderMinutes"),
    },
    container: {
        logo: $("#logoDiv"),
        progressBg: $("#backgroundOne"),
        progressBar: $("#searchProgressBar"),
        trips: $("#listContainer"),
        reminderBg: $("#reminderFormBg"),
        reminderFormDiv: $("#reminderFormDiv"),
        popUp: $("#popUp"),
        email: $("#emailForm"),
        originDiv: $("#originDiv"),
        destDiv: $("#destDiv"),
    },
    text: {
        counter: $("#counter"),
        counterInfo: $("#counterInfo"),
        searchFormInfo: $("#searchFormInfo"),
        reminderFormInfo: $("#reminderFormInfo"),
    },

}

let intern = {
    tripLocalArray: [],
    rtCheckInterval: 0,
    upCounterInterval: 0,
    chosenTrip: {},
    expectedDep: new Date(),
    alertSound: false,
}

$(document).ready(() => {
    UI.input.date.val(getTodayDate());
    UI.input.time.val(getNowTime());
    UI.btn.search.click(sendSearchForm);
    UI.btn.cancelReminder.click(cancelReminder);
    UI.btn.sendWebReminder.click(sendWebReminderForm);
    UI.btn.sendMailReminder.click(sendMailReminderForm);
    UI.btn.showMailReminder.click(openEmailForm);
    UI.container.logo.click(() => {
        document.location.href = "/";
    });
});

function getTodayDate() {
    let today = new Date();
    let dd = today.getDate();
    if (dd < 10) {
        dd = '0' + dd;
    }
    let mm = today.getMonth() + 1;
    if (mm < 10) {
        mm = '0' + mm;
    }
    let yyyy = today.getFullYear();
    return yyyy + '-' + mm + '-' + dd;
}

function getNowTime() {
    let today = addTime(new Date(), 5);
    let hh = today.getHours();
    if (hh < 10) {
        hh = '0' + hh;
    }
    let MM = today.getMinutes();
    if (MM < 10) {
        MM = '0' + MM;
    }
    return hh + ':' + MM;
}

function getOrigins() {
    resetOriginDiv();
    if (UI.input.origin.val()) {
        let textData = UI.input.origin.val();
        fetch('/siteinfo', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: textData
        }).then(function (response) {
            return response.json();
        }).then(function (data) {
            for (let key in data) {
                console.log(data[key].Name);
                if (data[key].Name) {
                    if (data[key].Name.toLowerCase().includes(UI.input.origin.val().toLowerCase())) {
                        let option = document.createElement('BUTTON');
                        option.classList.add("text-left", "btn", "btn-light", "col-12", "btn-sm");
                        option.setAttribute('type', 'button');
                        option.setAttribute('id', 'btnOriginOption' + key);
                        option.setAttribute('value', data[key].Name);
                        option.innerHTML = data[key].Name;
                        UI.container.originDiv.append(option);
                        $('#btnOriginOption' + key).click(() => {
                            console.log(event.target.value);
                            setInputOrigin(event.target.value);
                        });
                    }
                }
            }
            UI.container.originDiv.css('max-height', '1000px');
        });
    }
}

function setInputOrigin(input) {
    UI.input.origin.val(input);
    resetOriginDiv();
}

function resetOriginDiv() {
    UI.container.originDiv.css('max-height', '0px');
    UI.container.originDiv.empty();
}

function getDests() {
    resetDestDiv()
    if (UI.input.destination.val()) {
        let textData = UI.input.destination.val();
        fetch('http:/siteinfo', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: textData
        }).then(function (response) {
            return response.json();
        }).then(function (data) {
            for (let key in data) {
                if (data[key].Name) {
                    // UI.container.destDiv.children("button").each(() => {
                    //     console.log($(this));
                    //     if ($(this).attr('id') === 'btnDestOption' + key) {
                    //         console.log('hej du är här');
                    //         this.value = data[key].Name;
                    //     }
                    // });


                    if (data[key].Name.toLowerCase().includes(UI.input.destination.val().toLowerCase())) {
                        let option = document.createElement('BUTTON');
                        option.classList.add("text-left", "btn", "btn-light", "col-12", "btn-sm");
                        option.setAttribute('type', 'button');
                        option.setAttribute('id', 'btnDestOption' + key);
                        option.setAttribute('value', data[key].Name);
                        option.innerHTML = data[key].Name;
                        UI.container.destDiv.append(option);
                        $('#btnDestOption' + key).click(() => {
                            console.log(event.target.value);
                            setInputDest(event.target.value);
                        });
                    }
                }
                UI.container.destDiv.css('max-height', '1000px');
            }
        });
    }
}

function setInputDest(input) {
    UI.input.destination.val(input);
    resetDestDiv();
}

function resetDestDiv() {
    UI.container.destDiv.css('max-height', '0px');
    UI.container.destDiv.empty();
}

function isSearchTripFormValid() {
    if (UI.input.origin.val() === "" ||
        UI.input.destination.val() === "" ||
        UI.input.date.val() === "" ||
        UI.input.time.val() === "") {
        return false;
    } else {
        return true;
    }
}

function isReminderFormValid() {
    if (UI.input.tripIndex.val() === "" ||
        UI.input.minutes.val() === "" ||
        UI.input.email.val() === "") {
        return false;
    } else {
        return true;
    }
}

function isWebReminderFormValid() {
    if (UI.input.tripIndex.val() === "" ||
        UI.input.minutes.val() === "") {
        return false;
    } else {
        return true;
    }
}

function searchTrip() {
    UI.container.progressBg.removeClass('invisible');
    UI.container.progressBg.addClass('visible');
    UI.container.progressBar.attr('aria-valuenow', '10%').css('width', '10%');
    UI.container.trips.empty();
    let origin = UI.input.origin.val();
    let destination = UI.input.destination.val();
    let date = UI.input.date.val();
    let time = UI.input.time.val();

    let obj = {
        originId: origin,
        destId: destination,
        date: date,
        time: time
    };

    let str = 'originName=' + origin + '&destName=' + destination + '&date=' + date + '&time=' + time;

    UI.container.progressBar.attr('aria-valuenow', '98%').css('width', '98%');

    fetch('/search', {
        method: 'post',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: str
    }).then(function (response) {
        return response.json();
    }).then(function (data) {
        UI.container.progressBar.attr('aria-valuenow', '100%').css('width', '100%');
        intern.tripLocalArray = data;
        parseTrip(data);
    });


}

function sendSearchForm() {
    if (isSearchTripFormValid()) {
        UI.text.searchFormInfo.addClass('invisible');
        searchTrip();
    } else {
        UI.text.searchFormInfo.removeClass('invisible');
        UI.text.searchFormInfo.text('Formuläret tar inte emot tomma fält!');
        setTimeout(resetSearchFeedback, 5000);
    }
}

function resetSearchFeedback() {
    UI.text.searchFormInfo.addClass('invisible');
}

function sendWebReminderForm() {
    if (isWebReminderFormValid()) {
        resetDepartureAlert();
        setWebReminder();
        // UI.input.minutes.prop('disabled', true);
    } else {
        UI.text.reminderFormInfo.removeClass('invisible');
        UI.text.reminderFormInfo.text('Formuläret tar inte emot tomma fält!');
        setTimeout(resetReminderFeedback, 5000);
    }
}

function sendMailReminderForm() {
    if (isReminderFormValid()) {
        resetDepartureAlert();
        setMailReminder();
        UI.input.email.prop('disabled', true);
    } else {
        UI.text.reminderFormInfo.removeClass('invisible');
        UI.text.reminderFormInfo.text('Formuläret tar inte emot tomma fält!');
        setTimeout(resetReminderFeedback, 5000);
    }
}

function resetReminderFeedback() {
    UI.text.reminderFormInfo.addClass('invisible');
}

function openReminderForm() {
    UI.container.reminderBg.removeClass('invisible');
    UI.container.reminderBg.addClass('visible');
    UI.container.reminderFormDiv.css('top', '50%');
    UI.container.popUp.css('top', '50%');

    UI.input.tripIndex.val($(this).val());

    intern.chosenTrip = intern.tripLocalArray[$(this).val()];
    if (intern.chosenTrip.rtStartTime === null) {
        intern.expectedDep = parsedTimeTableTime(intern.chosenTrip.startTime);
    } else {
        intern.expectedDep = parsedTimeTableTime(intern.chosenTrip.rtStartTime);
    }
    startCounter();
}

function closeReminderForm() {
    UI.container.reminderFormDiv.css('top', '-50%');
    UI.container.popUp.css('top', '-50%');
    UI.input.tripIndex.val('');
    UI.text.counter.text('00:00');
    intern.chosenTrip.reminderMinutes = '';
    intern.chosenTrip = {};
    intern.expectedDep = new Date();
    stopCounter();
    setTimeout(() => {
        UI.container.reminderBg.removeClass('visible');
        UI.container.reminderBg.addClass('invisible');
        UI.text.reminderFormInfo.addClass('invisible');
    }, 500);
}

function openEmailForm() {
    UI.container.email.removeClass("myInvisible");
    UI.btn.sendWebReminder.addClass('myInvisible');
    UI.btn.showMailReminder.addClass('myInvisible');
    UI.btn.sendMailReminder.removeClass('myInvisible');
}

function closeEmailForm() {
    UI.input.email.val('');
    UI.input.minutes.val('10');

    UI.input.minutes.prop('disabled', false);
    UI.input.email.prop('disabled', false);

    UI.btn.sendMailReminder.prop('disabled', false);

    UI.container.email.addClass("myInvisible");
    UI.btn.sendMailReminder.addClass('myInvisible');
    UI.btn.sendWebReminder.removeClass('myInvisible');
    UI.btn.showMailReminder.removeClass('myInvisible');
}

function startCounter() {
    intern.rtCheckInterval = setInterval(() => {
        fetch('/checktime', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(intern.chosenTrip)
        }).then(function (response) {
            return response.text();
        }).then(function (data) {
            if (data === '') {
                console.log('inside: true');
                intern.expectedDep = intern.chosenTrip.startTime;
            } else {
                intern.expectedDep = parseTime(data);
            }
        });
    }, 5000);
    intern.upCounterInterval = setInterval(() => {
        updateCounter(new Date(), intern.expectedDep);
    }, 1000);
}

function stopCounter() {
    clearInterval(intern.rtCheckInterval);
    clearInterval(intern.upCounterInterval);
}


function parseTrip(output) {

    for (let row in output) {

        let trip = output[row];

        let travelTime = '';

        if (trip.hours === "") {
            travelTime = trip.minutes + 'min';
        } else {
            travelTime = trip.hours + ' h  ' + trip.minutes + ' min';
        }

        let startTime = trip.startTime.substring(0, 5);
        let endTime = trip.endTime.substring(0, 5);


        let resultDiv = document.createElement("DIV");
        resultDiv.classList.add("py-2", "my-3", "resultDiv");
        resultDiv.setAttribute("id", "resultDiv" + row);
        resultDiv.setAttribute("data-toggle", "collapse");
        resultDiv.setAttribute("href", "#detail" + row);
        resultDiv.style.animationDelay = (row * 0.05) + 's';

        let tripDiv = document.createElement("DIV");
        tripDiv.innerHTML = '<div class="d-flex justify-content-between">' +
            '<p><span>' + startTime + '</span> <i class="fas fa-long-arrow-alt-right"></i> <span>' + endTime + '</span></p>' +
            '<p>Restid: <span>' + travelTime + '</span></p>' +
            '</div>' +
            '<div class="d-flex justify-content-between align-items-center">' +
            '<p><span>' + trip.originName + '</span> <i class="fas fa-long-arrow-alt-right"></i> <span>' + trip.destName + '</span></p>' +
            '<button class="btn btn-reminder btn-link reminderButton" value="' + row + '" type="button" id="reminderBtn' + row + '"><i class="fas fa-bell"></i></button>' +
            '</div>'
            ;
        tripDiv.classList.add("m-4");

        let list = trip.legList;

        let tableStripe = true;
        for (let detail in list) {
            let leg = list[detail];
            let o = leg.Origin;
            let d = leg.Destination;

            let startTime = o.time.substring(0, 5);
            let endTime = d.time.substring(0, 5);

            let legIcon = setTransportIcon(leg.name);
            let legType = leg.name;
            if (legType === '') {
                legType = 'PROMENERA';
            }
            let legGoal = leg.direction;
            console.log(legGoal);
            if (legGoal === null) {
                legGoal = d.name;
            }


            let detailDiv = document.createElement("DIV");
            detailDiv.setAttribute("id", "detail" + row);
            detailDiv.classList.add("collapse");
            let stripe = '';
            if (tableStripe) {
                // detailDiv.classList.add("bg-light");
                detailDiv.style.backgroundColor = '#DEDEDE';
            }
            tableStripe = !tableStripe;
            detailDiv.innerHTML = '<div id="detailDiv">' +
                // '<div class="dropdown-divider"></div>' +
                '<p>&emsp;<i class="fas fa-angle-double-down smallArrows"></i> <span>' + startTime + '</span> <span>' + o.name + '</span></p>' +
                '<p>&emsp;&emsp;' + legIcon + '&emsp;<span>' + legType + '</span> mot <span>' + legGoal + '</span></p>' +
                '<p>&emsp;<i class="fas fa-angle-double-right smallArrows"></i> <span>' + endTime + '</span> <span>' + d.name + '</span></p>' +
                '</div>'
                ;
            tripDiv.appendChild(detailDiv);
        }

        resultDiv.appendChild(tripDiv);
        UI.container.trips.append(resultDiv);
        $("#reminderBtn" + row).click(openReminderForm);
        UI.container.progressBar.attr('aria-valuenow', '0%').css('width', '0%');
        UI.container.progressBg.removeClass('visible');
        UI.container.progressBg.addClass('invisible');
        window.location.hash = '#listBottom';
        window.location.hash = '#listContainer';
    }
}

function cancelReminder() {
    stopCounter();
    resetDepartureAlert();
    closeEmailForm()
    closeReminderForm();
}

function setMailReminder() {
    intern.chosenTrip.email = UI.input.email.val();
    intern.chosenTrip.reminderMinutes = UI.input.minutes.val();
    fetch('/reminder', {
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(intern.chosenTrip)
    }).then(function (response) {
        return response.json();
    }).then(function (data) {
        if (data) {
            UI.text.reminderFormInfo.removeClass('invisible');
            UI.text.reminderFormInfo.text('Mailpåminnelse registrerat');
            setTimeout(resetReminderFeedback, 5000);
            UI.btn.sendMailReminder.prop('disabled', true);
        } else {
            UI.text.reminderFormInfo.removeClass('invisible');
            UI.text.reminderFormInfo.text('Kunde inte registrera mailpåminnelse');
            setTimeout(resetReminderFeedback, 5000);
        }
    });
}

function setWebReminder() {
    intern.chosenTrip.reminderMinutes = UI.input.minutes.val();
    UI.text.reminderFormInfo.removeClass('invisible');
    UI.text.reminderFormInfo.text('Webbpåminnelse registrerat');
    setTimeout(resetReminderFeedback, 5000);
}

function updateCounter(now, departure) {
    console.log('n:' + now);
    console.log('d:' + departure);
    let diff = departure - now;
    console.log('diff:' + diff);

    if (diff < 0) {
        UI.text.counter.text('00:00');
        UI.text.counterInfo.text('Avgångstiden har passerat');
        UI.btn.showMailReminder.prop('disabled', true);
        UI.btn.sendWebReminder.prop('disabled', true);
        UI.btn.sendMailReminder.prop('disabled', true);
    } else {
        UI.text.counterInfo.text('Avgång om');
        UI.btn.showMailReminder.prop('disabled', false);
        UI.btn.sendWebReminder.prop('disabled', false);
        UI.btn.sendMailReminder.prop('disabled', false);
        let counterMinutes = Math.floor(diff / 60000);
        let counterSeconds = Math.floor((diff % 60000) / 1000);
        if (intern.chosenTrip.reminderMinutes) {
            alertDeparture(counterSeconds, counterMinutes, intern.chosenTrip.reminderMinutes);
        }
        if (counterSeconds < 10) {
            counterSeconds = '0' + counterSeconds;
        }
        if (counterMinutes < 10) {
            counterMinutes = '0' + counterMinutes;
        }
        UI.text.counter.text(counterMinutes + ':' + counterSeconds);
    }
}

function addTime(date, min) {
    return new Date(date.getTime() + min * 60000);
}

function parseTime(dateStr) {
    let year = dateStr.substring(0, 4);
    let month = Number(dateStr.substring(5, 7)) - 1;
    let day = dateStr.substring(8, 10);
    let h = dateStr.substring(11, 13);
    let m = dateStr.substring(14, 16);
    let s = dateStr.substring(17, 19);
    let parsedDate = new Date(year, month, day, h, m, s);
    // console.log('parsed: ' + parsedDate);
    return parsedDate;
}

function parsedTimeTableTime(timeTableTime) {
    console.log(timeTableTime);
    let h = timeTableTime.substring(0, 2);
    let m = timeTableTime.substring(3, 5);
    let s = timeTableTime.substring(6);
    let timeTableDate = new Date();
    timeTableDate.setHours(h, m, s);
    return timeTableDate;
}



function alertDeparture(seconds, minutes, reminderMinutes) {
    if ((reminderMinutes == minutes && seconds == 0) ||
        (reminderMinutes > minutes)) {
        if (!alertSound) {
            let audio = new Audio('/alert.mp3');
            UI.container.reminderFormDiv.addClass('shake');
            audio.play();
            alertSound = !alertSound;
        }
        UI.container.popUp.css('top', '12%');
    } else {
        resetDepartureAlert();
    }
}

function resetDepartureAlert() {
    UI.container.popUp.css('top', '50%');
    alertSound = false;
    UI.container.reminderFormDiv.removeClass('shake');
}

function setTransportIcon(input) {
    let icon = '';
    let color = '';
    let style = '';
    let array = input.split('  ');
    if (array.length > 1) {
        console.log(array[0]);
        switch (array[0]) {
            case 'TUNNELBANA':
                icon = 'fas fa-subway';
                break;
            case 'PENDELTÅG':
                icon = 'fas fa-train';
                break;
            case 'BUSS':
                icon = 'fas fa-bus';
                break;
            case 'BÅT':
                icon = 'fas fa-ship';
                break;
            case 'LOKALTÅG':
                icon = 'fas fa-train';
                break;
            default:
                icon = 'fas fa-train';
                break;
        }
        if (array[0] === 'TUNNELBANA') {
            switch (array[1]) {
                case '10':
                case '11':
                    color = 'text-primary';
                    break;
                case '13':
                case '14':
                    color = 'text-danger';
                    break;
                case '17':
                case '18':
                case '19':
                    color = 'text-success';
                    break;
            }
        }
        if (array[0] === 'PENDELTÅG') {
            style = '#FF73D4';
        }
        if (array[0] === 'LOKALTÅG') {
            switch (array[1]) {
                case '7':
                    color = 'text-secondary';
                    break;
                case '12':
                    style = '#787AFF';
                    break;
                case '21':
                    style = '#FF4F07';
                    break;
                case '22':
                    color = 'text-warning';
                    break;
                case '25':
                case '26':
                    color = 'text-info';
                    break;
                case '27':
                case '28':
                case '29':
                    style = '#7B35FF';
                    break;
            }
        }
        if (array[0] === 'BUSS') {
            switch (array[1]) {
                case '1':
                case '2':
                case '3':
                case '4':
                case '6':
                case '172':
                case '173':
                case '176':
                case '177':
                case '178':
                case '179':
                case '471':
                case '474':
                case '670':
                case '676':
                case '677':
                case '873':
                case '875':
                    color = 'text-primary';
                    break;
                default:
                    color = 'text-danger';
                    break;
            }
        }
    } else {
        icon = 'fas fa-walking';
    }
    let i = '<i class=\"' + icon + ' ' + color + '\" style=\"color:' + style + ';\"></i>';
    console.log(i);
    return i;
}