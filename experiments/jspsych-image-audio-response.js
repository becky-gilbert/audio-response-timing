/**
 * jspsych-image-audio-response
 * Matt Jaquiery, Feb 2018 (https://github.com/mjaquiery)
 * Becky Gilbert, Apr 2020 (https://github.com/becky-gilbert)
 *
 * plugin for displaying a stimulus and getting an audio response
 *
 * documentation: docs.jspsych.org
 *
 **/

jsPsych.plugins["image-audio-response"] = (function() {

    let plugin = {};

    jsPsych.pluginAPI.registerPreload('image-audio-response', 'stimulus', 'image');

    plugin.info = {
        name: 'image-audio-response',
        description: 'Present an image and retrieve an audio response',
        parameters: {
            stimulus: {
                type: jsPsych.plugins.parameterType.IMAGE,
                pretty_name: 'Stimulus',
                default: undefined,
                description: 'The image to be displayed'
            },
            buffer_length: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'Buffer length',
                default: 4000,
                description: 'Length of the audio buffer.'
            },
            postprocessing: {
                type: jsPsych.plugins.parameterType.FUNCTION,
                pretty_name: 'Postprocessing function',
                default: function(data) {
                    return new Promise(function(resolve) {
                        const blob = new Blob(data, { type: 'audio/webm' });
                        // create URL, which is used to replay the audio file (if allow_playback is true)
                        let url = URL.createObjectURL(blob);
                        var reader = new window.FileReader();
                        reader.readAsDataURL(blob);
                        const readerPromise = new Promise(function(resolveReader) {
                            reader.onloadend = function() {
                                // Create base64 string, which is used to save the audio data in JSON/CSV format.
                                // This has to go inside of a Promise so that the base64 data is converted before the 
                                // higher-level data processing Promise is resolved (since that will pass the base64
                                // data to the onRecordingFinish function).
                                var base64 = reader.result;
                                base64 = base64.split(',')[1];
                                resolveReader(base64);
                            };
                        });
                        readerPromise.then(function(base64) {
                            // After the base64 string has been created we can resolve the higher-level Promise, 
                            // which pass both the base64 data and the URL to the onRecordingFinish function.
                            var processed_data = {url: url, str: base64};
                            resolve(processed_data);
                        });
                    });
                },
                description: 'Function to execute on the audio data prior to saving. '+
                    'This function takes the audio data as an argument, '+
                    'and returns an object with keys called "str" and "url". '+
                    'The str and url values are saved in the trial data as "audio_data" and "audio_url". '+
                    'The url value is used as the audio source to replay the recording if allow_playback is true. '+
                    'By default, the str value is a base64 string which can be saved in the JSON/CSV data and '+
                    'later converted back into an audio file. '+
                    'This parameter can be used to pass a custom function that saves the file using a different '+
                    'method/format and generates an ID that relates this file to the trial data. '+
                    'The custom postprocessing function must return an object with "str" and "url" keys. '+
                    'The url value must be a valid audio source, which is used if allow_playback is true. '+
                    'The str value can be null.'
            },
            allow_playback: {
                type: jsPsych.plugins.parameterType.BOOL,
                pretty_name: 'Allow playback',
                default: true,
                description: 'Whether to allow the participant to play back their '+
                'recording and re-record if unhappy.'
            },
            recording_light: {
                type: jsPsych.plugins.parameterType.HTML_STRING,
                pretty_name: 'Recording light',
                default: '<div id="jspsych-image-audio-response-light" '+
                    'style="border: 2px solid darkred; background-color: darkred; '+
                    'width: 50px; height: 50px; border-radius: 50px; margin: 20px auto; '+
                    'display: block;"></div>',
                description: 'HTML to display while recording is in progress.'
            },
            recording_light_off: {
                type: jsPsych.plugins.parameterType.HTML_STRING,
                pretty_name: 'Recording light (off state)',
                default: '<div id="jspsych-image-audio-response-light" '+
                'style="border: 2px solid darkred; background-color: inherit; '+
                'width: 50px; height: 50px; border-radius: 50px; margin: 20px auto; '+
                'display: block;"></div>',
                description: 'HTML to display while recording is not in progress.'
            },
            prompt: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Prompt',
                default: null,
                description: 'Any content here will be displayed under the button.'
            },
            stimulus_duration: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'Stimulus duration',
                default: null,
                description: 'How long to show the stimulus.'
            },
			stimulus_height: {
				type: jsPsych.plugins.parameterType.INT,
				pretty_name: 'Image height',
				default: null,
				description: 'Set the image height in pixels'
			},
			stimulus_width: {
				type: jsPsych.plugins.parameterType.INT,
				pretty_name: 'Image width',
				default: null,
				description: 'Set the image width in pixels'
			},
			maintain_aspect_ratio: {
				type: jsPsych.plugins.parameterType.BOOL,
				pretty_name: 'Maintain aspect ratio',
				default: true,
				description: 'Maintain the aspect ratio after setting width or height'
			},
            margin_vertical: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Margin vertical',
                default: '0px',
                description: 'The vertical margin of the button.'
            },
            margin_horizontal: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Margin horizontal',
                default: '8px',
                description: 'The horizontal margin of the button.'
            },
            response_ends_trial: {
                type: jsPsych.plugins.parameterType.BOOL,
                pretty_name: 'Response ends trial',
                default: false,
                description: 'If true, then trial will end when user responds.'
            },
            wait_for_mic_approval: {
                type: jsPsych.plugins.parameterType.BOOL,
                pretty_name: 'Wait for mic approval',
                default: false,
                description: 'If true, the trial will not start until the participant approves the browser mic request.'
            },
            no_mic_message: {
                type: jsPsych.plugins.parameterType.HTML_STRING,
                pretty_name: 'No mic message',
                default: 'Audio recording not possible.',
                description: 'Message to show if no mic is found, or if the browser is not compatible.'
            }, 
            no_mic_message_duration: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'No mic message duration',
                default: 3000,
                description: 'Duration to show the no mic message, if no mic is found or the browser is not compatible.'
            }
        }
    };

    plugin.trial = function(display_element, trial) {

        if(typeof trial.stimulus === 'undefined'){
            console.error('Required parameter "stimulus" missing in image-audio-response');
        }

        let playbackElements = [];
        // store response
        let response = {
            rt: null,
            audio_data: null
        };
        let recorder = null;
        let start_time = null;
        var mic = false;

        // check if device has a mic, and if browser is compatible
        // from https://stackoverflow.com/questions/23288918/check-if-user-has-webcam-or-not-using-javascript-only/23289012
        function detect_mic(callback) {
            let md = navigator.mediaDevices;
            if (!md || !md.enumerateDevices || !md.getUserMedia) {
                callback(false);
            }
            md.enumerateDevices().then(function(devices) {
                var hasmic = devices.some(function(device) {
                    return 'audioinput' === device.kind;
                });
                callback(hasmic);
            });
        }

        detect_mic(function(has_mic) {

            if (!has_mic) {

                // no mic, or browser is not compatible, so display a message and then end the trial
                display_element.innerHTML = trial.no_mic_message;
                jsPsych.pluginAPI.setTimeout(function() {
                    end_trial();
                }, trial.no_mic_message_duration);

            } else {

                mic = true;
                
                // add stimulus
                var html = '<img src="'+trial.stimulus+'" id="jspsych-image-audio-response-stimulus" style="';
                if(trial.stimulus_height !== null){
                html += 'height:'+trial.stimulus_height+'px; '
                if(trial.stimulus_width == null && trial.maintain_aspect_ratio){
                    html += 'width: auto; ';
                }
                }
                if(trial.stimulus_width !== null){
                html += 'width:'+trial.stimulus_width+'px; '
                if(trial.stimulus_height == null && trial.maintain_aspect_ratio){
                    html += 'height: auto; ';
                }
                }
                html +='"></img>';

                // add prompt if there is one
                if (trial.prompt !== null) {
                    html += trial.prompt;
                }

                // add recording off light
                html += '<div id="jspsych-image-audio-response-recording-container">'+trial.recording_light_off+'</div>';

                // add audio element container with hidden audio element
                html += '<div id="jspsych-image-audio-response-audio-container"><audio id="jspsych-image-audio-response-audio" controls style="visibility:hidden;"></audio></div>';

                // add button element with hidden buttons
                html += '<div id="jspsych-image-audio-response-buttons"><button id="jspsych-image-audio-response-okay" class="jspsych-audio-response-button jspsych-btn" style="display: inline-block; margin:'+trial.margin_vertical+' '+trial.margin_horizontal+'; visibility:hidden;">Okay</button><button id="jspsych-image-audio-response-rerecord" class="jspsych-audio-response-button jspsych-btn" style="display: inline-block; margin:'+trial.margin_vertical+' '+trial.margin_horizontal+'; visibility:hidden;">Rerecord</button></div>';

                function start_trial() {
                    display_element.innerHTML = html;
                    document.querySelector('#jspsych-image-audio-response-okay').addEventListener('click', end_trial);
                    document.querySelector('#jspsych-image-audio-response-rerecord').addEventListener('click', start_recording);
                    // Add visual indicators to let people know we're recording
                    document.querySelector('#jspsych-image-audio-response-recording-container').innerHTML = trial.recording_light;
                    // trial start time
                    start_time = performance.now();
                    // set timer to hide image if stimulus duration is set
                    if (trial.stimulus_duration !== null) {
                        jsPsych.pluginAPI.setTimeout(function() {
                            display_element.querySelector('#jspsych-image-audio-response-stimulus').style.visibility = 'hidden';
                        }, trial.stimulus_duration);
                    }
                    if (!trial.wait_for_mic_approval) {
                        start_recording();
                    }
                }

                // audio element processing
                function start_recording() {
                    // hide existing playback elements
                    playbackElements.forEach(function (id) {
                        let element = document.getElementById(id);
                        element.style.visibility = 'hidden';
                    });
                    navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(process_audio);
                    if (!trial.wait_for_mic_approval) {
                        // Add visual indicators to let people know we're recording
                        document.querySelector('#jspsych-image-audio-response-recording-container').innerHTML = trial.recording_light;
                    }
                }
                
                // function to handle responses by the subject
                function process_audio(stream) {

                    if (trial.wait_for_mic_approval) {
                        if (start_time === null) {
                            start_trial();
                        } else {
                            document.querySelector('#jspsych-image-audio-response-recording-container').innerHTML = trial.recording_light;
                        }
                    } 

                    // This code largely thanks to skyllo at
                    // http://air.ghost.io/recording-to-an-audio-file-using-html5-and-js/

                    // store streaming data chunks in array
                    const chunks = [];
                    // create media recorder instance to initialize recording
                    // Note: the MediaRecorder function is not supported in Safari or Edge
                    recorder = new MediaRecorder(stream);
                    recorder.data = [];
                    recorder.wrapUp = false;
                    recorder.ondataavailable = function(e) {
                        // add stream data to chunks
                        chunks.push(e.data);
                        if (recorder.wrapUp) {
                            if (typeof trial.postprocessing !== 'undefined') {
                                trial.postprocessing(chunks)
                                    .then(function(processedData) {
                                        onRecordingFinish(processedData);
                                    });
                            } else {
                                // should never fire - trial.postprocessing should use the default function if
                                // not passed in via trial parameters
                                onRecordingFinish(chunks);
                            }
                        }
                    };

                    // start recording with 1 second time between receiving 'ondataavailable' events
                    recorder.start(1000);
                    // setTimeout to stop recording after 4 seconds
                    setTimeout(function() {
                        // this will trigger one final 'ondataavailable' event and set recorder state to 'inactive'
                        recorder.stop();
                        recorder.wrapUp = true;
                    }, trial.buffer_length);
                }

                function showPlaybackTools(data) {
                    // Audio Player
                    let playerDiv = display_element.querySelector('#jspsych-image-audio-response-audio-container');
                    let url;
                    if (data instanceof Blob) {
                        const blob = new Blob(data, { type: 'audio/webm' });
                        url = (URL.createObjectURL(blob));
                    } else {
                        url = data;
                    }
                    let player = playerDiv.querySelector('#jspsych-image-audio-response-audio');
                    player.src = url;
                    player.style.visibility = "visible";
                    // Okay/rerecord buttons
                    let buttonDiv = document.querySelector('#jspsych-image-audio-response-buttons');
                    let okay = buttonDiv.querySelector('#jspsych-image-audio-response-okay');
                    let rerecord = buttonDiv.querySelector('#jspsych-image-audio-response-rerecord');
                    okay.style.visibility = 'visible';
                    rerecord.style.visibility = 'visible';
                    // Save ids of things we want to hide later:
                    playbackElements = [player.id, okay.id, rerecord.id];
                }

                function onRecordingFinish(data) {
                    // switch to the off visual indicator
                    let light = document.querySelector('#jspsych-image-audio-response-recording-container');
                    if (light !== null)
                        light.innerHTML = trial.recording_light_off;
                    // measure rt
                    let end_time = performance.now();
                    let rt = end_time - start_time;
                    response.audio_data = data.str;
                    response.audio_url = data.url;
                    response.rt = rt;

                    if (trial.response_ends_trial) {
                        end_trial();
                    } else if (trial.allow_playback) {  // only allow playback if response doesn't end trial
                        showPlaybackTools(response.audio_url);
                    } else { 
                        // fallback in case response_ends_trial and allow_playback are both false, 
                        // which would mean the trial never ends
                        end_trial();
                    }
                }

                if (trial.wait_for_mic_approval) {
                    start_recording();
                } else {
                    start_trial();
                }
            }
        });

        // function to end trial when it is time
        function end_trial() {
            // kill any remaining setTimeout handlers
            jsPsych.pluginAPI.clearAllTimeouts();

            // gather the data to store for the trial
            let trial_data = {
                "rt": response.rt,
                "stimulus": trial.stimulus,
                "audio_data": response.audio_data,
                "has_mic": mic
            };

            // clear the display
            display_element.innerHTML = '';

            // move on to the next trial
            jsPsych.finishTrial(trial_data);
        }

    };

    return plugin;
})();
