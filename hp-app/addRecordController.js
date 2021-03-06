var app = angular.module('myApp')

app.controller('addRecordController', [
    '$scope', '$element', '$http', '_id', 'hid', 'privateKey', 'close',
    function ($scope, $element, $http, _id, hid, privateKey, close) {

        $scope.recordForm = {
            $class: "nz.ac.auckland.Record",
            id: "",
            record_date: "",
            record_code: "",
            record_reasonCode: "",
            record_reasonDesc: "",
            healthProvider: "",
            patient: ""
        }

        $scope.allergyForm = {}
        $scope.procedureForm = {}
        $scope.observationForm = {}
        $scope.medicationForm = {}
        $scope.immunizationForm = {}
        $scope.conditionForm = {}

        $scope.selectedRecord = {}
        $scope.types = ["Allergy", "Procedure", "Observation", "Medication", "Immunization", "Condition"]

        $scope.submitRecord = function () {

            var recordForm = {}
            // check for type of record selected, so it grabs info from the appropriate form on the html page.
            switch ($scope.selectedRecord.type) {
                case 'Allergy':
                    recordForm = $scope.allergyForm
                    break
                case 'Procedure':
                    recordForm = $scope.procedureForm
                    break
                case 'Observation':
                    recordForm = $scope.observationForm
                    break
                case 'Immunization':
                    recordForm = $scope.immunizationForm
                    break
                case 'Condition':
                    recordForm = $scope.conditionForm
                    break
                case 'Medication':
                    recordForm = $scope.medicationForm
                    break;
            }
            recordForm.id = uuidv4()
            recordForm = Object.assign({}, $scope.recordForm, recordForm) //combine the record form with the specified record type form
            recordForm.$class = namespace + '.' + $scope.selectedRecord.type
            recordForm.patient = "resource:" + namespace + ".Patient#" + _id
            recordForm.healthProvider = "resource:" + namespace + ".HealthProvider#" + hid
    
            dateToString(recordForm)
            var patientKey;
    
            var endpoint = endpoint2 + 'selectPatientKeysByPatientID?p=resource%3Anz.ac.auckland.Patient%23' + _id;
    
            $http.get(endpoint).then(function (response) { //check if patient has shared their key with HP
                console.log(response.data)
                if (response.data.length === 0) {
                    alert("The patient has not shared a key with you")
                    $scope.close()
                    return
                }
                // if they shared their key, add the record to the blockchain
                var pKeyBody = response.data[0]
                var encryptedKey = pKeyBody.encryptedPatientKeyHPPublic
    
                patientKey = $scope.tryDecrypt(encryptedKey)
    
                encryptForm(recordForm, patientKey)
    
                var endpoint = apiBaseURL + $scope.selectedRecord.type
                $scope.endpoint = endpoint
                clearFields()
    
                $http({
                    method: 'POST',
                    url: endpoint,
                    data: angular.toJson(recordForm),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(_success, _error)
            }, _error)
        }

        function clearFields() {
            $scope.recordForm = {
                $class: "nz.ac.auckland.Record",
                id: "",
                record_date: "",
                record_code: "",
                record_reasonCode: "",
                record_reasonDesc: "",
                healthProvider: "",
                patient: ""
            }
    
            $scope.allergyForm = {}
            $scope.procedureForm = {}
            $scope.observationForm = {}
            $scope.medicationForm = {}
            $scope.immunizationForm = {}
            $scope.conditionForm = {}
        }

        function encryptForm(form, patientKey) {
            var keys = Object.keys(form)
    
            keys.forEach(function (key) {
                if (!(key == "$class" || key == "id" || key == "patient" || key == "healthProvider")) {
                    var encryptedData = symEncrypt(form[key], patientKey)
                    form[key] = encryptedData.toString()
                }
    
            })
    
            console.log(form)
        }

        function dateToString(form) {
            var keys = Object.keys(form)
    
            keys.forEach(function (key) {
                if (form[key] instanceof Date) {
                    form[key] = form[key].toLocaleDateString('en-GB')
                }
            })
            console.log(form)
        }

        $scope.tryDecrypt = function (encryptedPkey) {

            return asymDecrypt(encryptedPkey, privateKey)
    
        }

        /**
         * Generate uuid
         */
        function uuidv4() {
            return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
              (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
            )
          }

        /**
         * Show response message in a pop-up dialog box
         *
         * @param response
         * @private
         */
        function _success(response) {
            $scope.close()
            alert("Operation successful")
        }

        /**
         * Show error message in a pop-up dialog box
         *
         * @param response
         * @private
         */
        function _error(response) {
            $scope.close()
            alert("Error: " + response.data.error.message);
        }

        //  This close function doesn't need to use jQuery or bootstrap, because
        //  the button has the 'data-dismiss' attribute.
        $scope.close = function () {
            close({
            }, 500); // close, but give 500ms for bootstrap to animate
        };

        //  This cancel function must use the bootstrap, 'modal' function because
        //  the doesn't have the 'data-dismiss' attribute.
        $scope.cancel = function () {

            //  Manually hide the modal.
            $element.modal('hide');

            //  Now call close, returning control to the caller.
            close({

            }, 500); // close, but give 500ms for bootstrap to animate
        };

    }]);