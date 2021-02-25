function detect_voice_onset_visual_check(FileName, PathName, beginFreq, endFreq, thresh4, startvalue, stepw, save_plot)

% The function detect_voice_onset_visual_check.m is designed to detect the
% onset of a voice (or other auditory signal) in a recorded .wav sound 
% file. This function can be used for visual detection of outliers found 
% by using the function detect_voice_onset_loop.m  
%
% requires:
% - filename as string
% - path of the directory containing the files as string
% - parameters for optimizing the detection:
%       - upper and lower bandpath filter frequencies 
%       - threshold for detection in % of changes in the signal variability
%       - skip detection in the first n ms of the wav files
%       - range or stepwidth for the calculation of the rolling SD.
% - whether you want to produce products
%
% produces:
% - a figure with 5 subplots:
%         - the original sound file
%         - the FFT of the sound file
%         - the filtered sound file
%         - the signal variability of the filtered sound file (rolling SD)
%         - a plot of the detected thresholds. The first positive value of
%           this plot represents the detected onset
% - can be saved on request (off by default) as bitmap
%
% DM - edited 2021
%
% license/author of original:
% This program is distributed in the hope that it will be useful,
% but WITHOUT ANY WARRANTY;
%
% This software is licensed under CC BY 4.0
%
% Version 1.0 by Michael Lindner 
% m.lindner@reading.ac.uk
% University of Reading, 2017
% Center for Integrative Neuroscience and Neurodynamics
% https://www.reading.ac.uk/cinn/cinn-home.aspx 

FileName = FileName{1};

outputfilename = ['visual_check_',FileName,'.bmp'];

% load file
filename = [PathName,filesep,FileName];
[f,fs] = audioread(filename);

% original sound file
N = size(f,1); % Determine total number of samples in audio file
h=figure('Position', [0, 0, 600, 800]);
subplot(5,1,1);
plot(f(:,1));
xlim([1 N])
title(['Original sound file']);


% Get the spectrum
df = fs / N;
w = (-(N/2):(N/2)-1)*df;
y = fft(f(:,1), N) / N; 
y2 = fftshift(y);

y3=y2(length(y2)/2+1:end);
%maxfreq=find(y3==max(y3));

% plot spectrum
subplot(5,1,2);
plot(w,abs(y2));
title('Spectrum');


% setup bandpath filter
n = 7;
Freq1 = beginFreq / (fs/2);
Freq2 = endFreq / (fs/2);
[b,a] = butter(n, [Freq1, Freq2], 'bandpass');
% [b2,a2] = butter(n, [(maxfreq-200)/(fs/2), (maxfreq+200)/(fs/2)], 'bandpass');

% apply filter
f_filtered = filter(b, a, f);

% plot (filtered sound file
subplot(5,1,3);
plot(f_filtered(:,1));
xlim([1 N])
title(['Filtered sound file']);


for ii=1:length(f_filtered)-stepw
    s(ii)=std(f_filtered(ii:ii+stepw-1));
end

subplot(5,1,4);
plot(s)
xlim([1 length(s)])
title(['Rolling SD']);


d4x=find(s>thresh4*max(s(:)));
d4x(d4x<startvalue/1000*fs)=[];
d4=zeros(size(f));
d4(d4x)=1;

subplot(5,1,5);
plot(d4)

xlim([1 length(s)])
title(['Reaching threshold (first: ',num2str(min(find(d4==1))/fs*1000),' ms)']);

xlabel('samples')

if exist('save_plot','var')
    if save_plot
        saveas(h,outputfilename,'bmp')
    end
end

