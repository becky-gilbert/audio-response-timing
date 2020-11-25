/**
 * jspsych-image-audio-response
 * Matt Jaquiery, Feb 2018 (https://github.com/mjaquiery)
 * Becky Gilbert, Apr 2020 (https://github.com/becky-gilbert)
 * Dorian Minors
 *
 * plugin for displaying a stimulus and getting an audio response
 * 
 * requestAnimationFrame version for syncing recording and image display 
 *
 * documentation: docs.jspsych.org
 *
 **/

jsPsych.plugins["image-audio-response-rAF"] = (function() {

    let plugin = {};

    jsPsych.pluginAPI.registerPreload('image-audio-response-rAF', 'stimulus', 'image');

    plugin.info = {
        name: 'image-audio-response-rAF',
        description: 'Present an image and retrieve an audio response',
        parameters: {
            stimulus: {
                type: jsPsych.plugins.parameterType.IMAGE,
                pretty_name: 'Stimulus',
                default: undefined,
                description: 'The image to be displayed.'
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
                description: 'Whether or not to allow the participant to play back their audio recording and re-record if desired.'
            },
            recording_indicator_type: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'Recording indicator type',
                default: 1,
                description: 'Selects which recording indicator type to use. '+
                '1- Obvious recording indicator (default): filled/unfilled red circle under image, all content centered. '+
                '2- Unobtrusive recording indicator: image centered, with "recording..." or "not recording..." text in bottom-right corner. '+
                '3- Custom HTML. Stimulus/prompt will be placed directly above the recording on/off HTML, and all content will be centered. '+
                '4- Custom HTML. Stimulus/prompt will be centered regardless of recording on/off HTML positioning.'
            },
            recording_on_indicator: {
                type: jsPsych.plugins.parameterType.HTML_STRING,
                pretty_name: 'Recording on indicator',
                default: null,
                description: 'HTML to display while recording is in progress. See recording_indicator_type for default options. '+
                'This parameter only needs to be specified if custom recording on/off HTML is used (recording_indicator_type is 3 or 4). '+
                'If recording_indicator_type is 1 or 2, then any values passed to this parameter will be ignored.'
            },
            recording_off_indicator: {
                type: jsPsych.plugins.parameterType.HTML_STRING,
                pretty_name: 'Recording off indicator',
                default: null,
                description: 'HTML to display while recording is not in progress. See recording_indicator_type for default options. '+
                'This parameter only needs to be specified if custom recording on/off HTML is used (recording_indicator_type is 3 or 4). '+
                'If recording_indicator_type is 1 or 2, then any values passed to this parameter will be ignored.'
            },
            prompt: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Prompt',
                default: null,
                description: 'Any content here will be displayed under the image.'
            },
            stimulus_duration: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'Stimulus duration',
                default: null,
                description: 'How long to show the stimulus. If null, the image will be displayed until the trial ends.'
            },
			stimulus_height: {
				type: jsPsych.plugins.parameterType.INT,
				pretty_name: 'Image height',
				default: null,
                description: 'Image height in pixels. If null, the original image height will be used (unless stimulus_width is specified and maintain_aspect_ratio is true, '+
                'in which case stimulus_height will be adjusted accordingly).'
			},
			stimulus_width: {
				type: jsPsych.plugins.parameterType.INT,
				pretty_name: 'Image width',
				default: null,
				description: 'Image width in pixels. If null, the original image width will be used (unless stimulus_height is specified and maintain_aspect_ratio is true, '+
                'in which case stimulus_width will be adjusted accordingly).'
            },
			maintain_aspect_ratio: {
				type: jsPsych.plugins.parameterType.BOOL,
				pretty_name: 'Maintain aspect ratio',
				default: true,
                description: 'Whether or not to maintain the aspect ratio of the image stimulus after setting width or height. If false, and if only one dimension is specified, '+
                'then the unspecified dimension will be the original image . If true, and if only one dimension is specified, then the unspecified dimension will change '+
                'so that the image aspect ratio is maintained. If both stimulus_height and stimulus_width are specified, then this parameter will be ignored.'
            },
            button_label_okay: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Button label okay',
                default: 'Okay',
                description: 'Label of the button that accepts the audio response and ends the trial, which is shown when allow_playback is true.'
            },
            button_label_rerecord: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Button label rerecord',
                default: 'Rerecord',
                description: 'Label of the button that re-records the audio response, which is shown when allow_playback is true.'
            },
            margin_vertical: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Margin vertical',
                default: '0px',
                description: 'The vertical margin of the "okay" and "rerecord" buttons.'
            },
            margin_horizontal: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Margin horizontal',
                default: '8px',
                description: 'The horizontal margin of the "okay" and "rerecord" buttons.'
            },
            wait_for_mic_approval: {
                type: jsPsych.plugins.parameterType.BOOL,
                pretty_name: 'Wait for mic approval',
                default: true,
                description: 'If true, the trial will not start until the participant approves the browser mic request. If false, '+
                'the image/prompt will be shown immediately, regardless of whether the participant needs to approve the mic before the recording can start.'
            },
            no_mic_message: {
                type: jsPsych.plugins.parameterType.HTML_STRING,
                pretty_name: 'No mic message',
                default: 'Audio recording not possible.',
                description: 'HTML-formatted string with message to show if no mic is found, or if the browser is not compatible.'
            }, 
            no_mic_message_duration: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'No mic message duration',
                default: 3000,
                description: 'Duration to show the no mic message, in ms, if no mic is found or the browser is not compatible.'
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
var frame_time_estimate = null;
        var recording_on_html, recording_off_html;



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
                
                // create stimulus HTML
                var html = '<div id="jspsych-image-audio-response-container" ';
                if (trial.recording_indicator_type == 2 || trial.recording_indicator_type == 4) {
                    // position stimulus/prompt/playback controls in center of screen, irrespective of recording on/off HTML
                    html += 'style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%)";';
                }
                html += '><img src="'+trial.stimulus+'" id="jspsych-image-audio-response-stimulus" style="';
                if(trial.stimulus_height !== null){
                    html += 'height:'+trial.stimulus_height+'px;';
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
                html +='">';

                // add prompt if there is one
                if (trial.prompt !== null) {
                    html += trial.prompt;
                }

                // set up recording indicator
                if (trial.recording_indicator_type === 1) {
                    // if indicator type 1, use HTML for obvious indicator (default)
                    recording_on_html = '<div id="jspsych-image-audio-response-indicator" '+
                        'style="border: 2px solid darkred; background-color: darkred; '+
                        'width: 50px; height: 50px; border-radius: 50px; margin: 20px auto; '+
                        'display: block;"></div>';	
                    recording_off_html = '<div id="jspsych-image-audio-response-indicator" '+
                        'style="border: 2px solid darkred; background-color: inherit; '+
                        'width: 50px; height: 50px; border-radius: 50px; margin: 20px auto; '+
                        'display: block;"></div>';	
                } else if (trial.recording_indicator_type === 2) {
                    // if indicator type 2, use HTML for unobtrusive indicator
                    recording_on_html = '<div id="jspsych-image-audio-response-indicator" '+
                        'style="position: fixed; bottom: 0; right: 0;">recording...</div>';	
                    recording_off_html = '<div id="jspsych-image-audio-response-indicator" '+
                        'style="position: fixed; bottom: 0; right: 0;">not recording...</div>';	
                } else {
                    // if indicator type 3 or 4 && HTML left unspecified, then throw error 
                    if (trial.recording_on_indicator === null || trial.recording_off_indicator === null) {
                        console.error('Error in jspsych-image-audio-response.js: No recording indicator HTML specified.');
                    } else {
                        recording_on_html = trial.recording_on_indicator;
                        recording_off_html = trial.recording_off_indicator;
                    }
                } 
                if (trial.recording_indicator_type === 1 || trial.recording_indicator_type === 3) {
                    // add recording off indicator into stimulus/prompt container div so that it is centered with this content
                    html += '<div id="jspsych-image-audio-response-recording-container">'+recording_off_html+'</div>';
                }
                // add audio element container with hidden audio element
                html += '<div id="jspsych-image-audio-response-audio-container"><audio id="jspsych-image-audio-response-audio" controls style="visibility:hidden;"></audio></div>';

                // add button element with hidden buttons
                html += '<div id="jspsych-image-audio-response-buttons"><button id="jspsych-image-audio-response-okay" class="jspsych-audio-response-button jspsych-btn" style="display: inline-block; margin:'+trial.margin_vertical+' '+trial.margin_horizontal+'; visibility:hidden;">'+trial.button_label_okay+'</button><button id="jspsych-image-audio-response-rerecord" class="jspsych-audio-response-button jspsych-btn" style="display: inline-block; margin:'+trial.margin_vertical+' '+trial.margin_horizontal+'; visibility:hidden;">'+trial.button_label_rerecord+'</button></div>';
                html += '</div>';  // end container div
                if (trial.recording_indicator_type === 2 || trial.recording_indicator_type === 4) {
                    // add recording off indicator outside of stimulus/prompt container div to allow custom positioning
                    html += '<div id="jspsych-image-audio-response-recording-container">'+recording_off_html+'</div>';
                }

                function start_trial() {
                    window.requestAnimationFrame(function(){
                        window.requestAnimationFrame(function(timestamp) {
                            display_element.innerHTML = html;
                            document.querySelector('#jspsych-image-audio-response-okay').addEventListener('click', end_trial);
                            document.querySelector('#jspsych-image-audio-response-rerecord').addEventListener('click', start_recording);

                            // set timer to hide image if stimulus duration is set
                            if (trial.stimulus_duration !== null) {
                                jsPsych.pluginAPI.setTimeout(function() {
                                    display_element.querySelector('#jspsych-image-audio-response-stimulus').style.visibility = 'hidden';
                                }, trial.stimulus_duration);
                            }
                            if (!trial.wait_for_mic_approval) {
                                start_recording();
                            }
                            // record the start time 
                            start_time = timestamp;
                            // reset the frame time estimate
                            frame_time_estimate = null;
                            last_frame_time = start_time;
                            // setup the next rAF call to check for timeouts.
                            window.requestAnimationFrame(checkForTimeout);
                        });
                    });
                }

                function checkForTimeout(timestamp) {
                  // get the estimated length of a single frame
                    frame_time_estimate = timestamp - last_frame_time;
                    // calculate an estimate of how long the stimulus has been on the screen
                    var curr_duration = timestamp - start_time;
                    // check if the current duration is at least as long as the intended duration
                    // minus half the estimated frame time. this helps avoid displaying the stimulus
                    // for one too many frames.
                    if (curr_duration >= trial.buffer_length - frame_time_estimate/2) { // if within ~half a frame of the recording length
                        if (trial.allow_playback) {  // only allow playback if response doesn't end trial
                            showPlaybackTools(response.audio_url);
                        } else { 

                            end_trial();
                        }
                    } else {
                        last_frame_time = timestamp;
                        window.requestAnimationFrame(checkForTimeout);
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
                
                // function to start of recording, after getUserMedia request has been approved
                function process_audio(stream) {

                    if (trial.wait_for_mic_approval && start_time === null) {
                        start_trial();
                    }
                    // After recording has been approved by user, add visual indicators to let people know we're recording
                    document.querySelector('#jspsych-image-audio-response-recording-container').innerHTML = recording_on_html;

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
                    // setTimeout to stop recording 
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
                    } else if (typeof data.url !== 'undefined' && data.url !== null) {
                        url = data.url;
                    } else {
                        console.error("Error in jspsych-image-audio-response.js: The postprocessing function must return an audio blob or URL to replay the audio.")
                    }
                    let player = playerDiv.querySelector('#jspsych-image-audio-response-audio');
                    player.src = url;
                    player.style.visibility = "visible";
                    // show okay/rerecord buttons
                    let buttonDiv = document.querySelector('#jspsych-image-audio-response-buttons');
                    let okay = buttonDiv.querySelector('#jspsych-image-audio-response-okay');
                    let rerecord = buttonDiv.querySelector('#jspsych-image-audio-response-rerecord');
                    okay.style.visibility = 'visible';
                    rerecord.style.visibility = 'visible';
                    // Save IDs of things we want to hide later:
                    playbackElements = [player.id, okay.id, rerecord.id];
                }

                function onRecordingFinish(data) {
                    // switch to the recording_off_indicator
                    let light = document.querySelector('#jspsych-image-audio-response-recording-container');
                    if (light !== null) {
                        light.innerHTML = recording_off_html;
                    }
                    // measure rt
                    let end_time = performance.now();
                    let rt = end_time - start_time;
                    response.audio_data = data.str;

                    response.rt = rt;

                    if (trial.allow_playback) {  
                        showPlaybackTools(data);
                    } else { 

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
