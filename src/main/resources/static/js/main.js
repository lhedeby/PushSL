$(document).ready(() => {
    $("#btnSearch").click(searchTrip);
    $("#date").val(getTodayDate());
    $("#time").val(getNowTime());
    $("#reminderCancel").click(cancelReminder);
    $("#reminderOK").click(startReminder);
}
);

let tripLocalArray = [];


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
    let today = new Date();
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
    $("#originList").empty();
    let textData = $("#inputOrigin").val();
    fetch('http://localhost:8080/siteinfo', {
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
        },
        body: textData
    }).then(function (response) {
        return response.json();
    }).then(function (data) {
        for (let key in data) {
            let option = document.createElement("OPTION");
            option.setAttribute("value", data[key].Name);
            option.classList.add("form-control")

            $("#originList").append(option);
        }
    });
}

function getDests() {
    $("#destList").empty();
    let textData = $("#inputDestination").val();
    fetch('http://localhost:8080/siteinfo', {
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
        },
        body: textData
    }).then(function (response) {
        return response.json();
    }).then(function (data) {
        for (let key in data) {
            let option = document.createElement("OPTION");
            option.setAttribute("value", data[key].Name);
            option.classList.add("form-control")

            $("#destList").append(option);
        }
    });
}

function searchTrip() {
    $("#listContainer").empty();
    let origin = $("#inputOrigin").val();
    let destination = $("#inputDestination").val();
    let date = $("#date").val();
    let time = $("#time").val();

    let obj = {
        originId: origin,
        destId: destination,
        date: date,
        time: time
    };

    let str = 'originName=' + origin + '&destName=' + destination + '&date=' + date + '&time=' + time;

    fetch('http://localhost:8080/search', {
        method: 'post',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: str
    }).then(function (response) {
        return response.json();
    }).then(function (data) {
        tripLocalArray = data;
        parseTrip(data);
    });
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
        resultDiv.classList.add("py-2", "my-3");
        resultDiv.setAttribute("id", "resultDiv");
        resultDiv.setAttribute("data-toggle", "collapse");
        resultDiv.setAttribute("href", "#detail" + row);

        let tripDiv = document.createElement("DIV");
        tripDiv.innerHTML = '<div class="d-flex justify-content-between">' +
            '<p><span>' + startTime + '</span> <i class="fas fa-long-arrow-alt-right"></i> <span>' + endTime + '</span></p>' +
            '<p>Restid: <span>' + travelTime + '</span></p>' +
            '</div>' +
            '<div class="d-flex justify-content-between align-items-center">' +
            '<p><span>' + trip.originName + '</span> <i class="fas fa-long-arrow-alt-right"></i> <span>' + trip.destName + '</span></p>' +
            '<button class="btn btn-link btn-reminder reminderButton" value="' + row + '" type="button" id="reminderBtn' + row + '"><i class="fas fa-bell"></i></button>' +
            '</div>'
            ;
        tripDiv.classList.add("m-4");

        let list = trip.legList;

        for (let detail in list) {
            let leg = list[detail];
            let o = leg.Origin;
            let d = leg.Destination;

            let startTime = o.time.substring(0, 5);
            let endTime = d.time.substring(0, 5);

            let detailDiv = document.createElement("DIV");
            detailDiv.setAttribute("id", "detail" + row);
            detailDiv.classList.add("collapse");
            detailDiv.innerHTML = '<div id="detailDiv">' +
                '<div class="dropdown-divider"></div>' +
                '<p>&emsp;<i class="fas fa-angle-double-down"></i> <span>' + startTime + '</span> <span>' + o.name + '</span></p>' +
                '<p>&emsp;&emsp;<span>' + leg.category + '</span></p>' +
                '<p>&emsp;<i class="fas fa-angle-double-right"></i> <span>' + endTime + '</span> <span>' + d.name + '</span></p>' +
                '</div>'
                ;
            tripDiv.appendChild(detailDiv);
        }

        resultDiv.appendChild(tripDiv);
        $("#listContainer").append(resultDiv);
        $("#reminderBtn" + row).click(showReminderForm);
    }
}

function showReminderForm() {
    $("#reminderFormBg").removeClass('invisible');
    $("#reminderFormBg").addClass('visible');
    $("#tripIndex").val($(this).val());
    console.log($("#tripIndex").val());
    console.log(tripLocalArray[$("#tripIndex").val()]);
}

function cancelReminder() {
    $("#reminderFormBg").removeClass('visible');
    $("#reminderFormBg").addClass('invisible');
}

function startReminder() {
    let chosenTrip = tripLocalArray[$('#tripIndex').val()];
    let expectedDep = chosenTrip.startTime;
    fetch('http://localhost:8080/reminder', {
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(chosenTrip)
    }).then(function (response) {
        return response.json();
    }).then(function (data) {
        if (data) {
            setInterval(() => {
                fetch('http://localhost:8080/checktime', {
                    method: 'post',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(chosenTrip)
                }).then(function (response) {
                    return response.text();
                }).then(function (data) {
                    expectedDep = parseTime(data);
                });
            }, 5000);
            setInterval(() => {
                updateCounter(new Date(), expectedDep);
            }, 1000);
        } else {
            console.log('Could not set reminder');
        }

    });

}

function updateCounter(now, departure) {
    console.log('now: ' + now);
    console.log('dep: ' + departure);
    let diff = departure - now;
    console.log('timediff ' + diff)
    let counterMinutes = Math.floor(diff / 60000);
    let counterSeconds = Math.floor((diff % 60000) / 1000);
    $("#counter").text(counterMinutes + ':' + counterSeconds);
}

function addTime(date, min) {
    return new Date(date.getTime() + min * 60000);
}

function parseTime(dateStr) {
    let year = dateStr.substring(0, 4);
    let month = Number(dateStr.substring(5, 7)) - 1;
    let day = dateStr.substring(8, 10);
    let h = dateStr.substring(11, 13);
    let m =dateStr.substring(14, 16);
    let s = dateStr.substring(17, 19);
    let parsedDate = new Date(year, month, day, h, m, s);
    console.log('parsed: ' + parsedDate);
    return parsedDate;
}