function [res,meanThreshold] = detect_voice_onset_loop(FileName, PathName, beginFreq, endFreq, thresh4, startvalue, stepw, produce_plot, customYlim, produce_txtfile)

% The function detect_voice_onset_loop.m is designed to detect the onset of
% a voice (or other auditory signal) in a recorded .wav sound file.
% The function loops over a given set of .wav files and does the detection
% for each one separately. 
%
% requires:
% - cell array of filenames as strings
% - path of the directory containing the files
% - parameters for optimizing the detection:
%       - upper and lower bandpath filter frequencies 
%       - threshold for detection in % of changes in the signal variability
%       - skip detection in the first n ms of the wav files
%       - range or stepwidth for the calculation of the rolling SD.
% - whether you want to produce products
%
% produces on request (off by default):
% - textfile with the filenames and the detection onset times
% - a figure with a plot of the onsets (saved as bitmap)
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

if ~exist('produce_txtfile','var')
    produce_txtfile = 0;
end
if ~exist('produce_plot','var')
    produce_plot = 0;
end

% get file and pathnames
out=regexp(PathName,filesep,'split');

% get date string for output file
actdat=datestr(datetime('now','TimeZone','local','Format','d-MMM-y_HH-mm-ss'));
actdat(actdat==' ')='_';
actdat(actdat==':')='-';

if produce_txtfile
    % create output file
    outputfilename = ['thresholds_txt_',out{length(out)-1},'_filter',num2str(beginFreq),'to',num2str(round(endFreq/1000)),'k_fhresh',num2str(thresh4),'_',actdat,'.txt'];
    FID = fopen(outputfilename,'w');
end

% predefine vector
res=nan(length(length(FileName)),1);

% Loop over files

for rrr=1:length(FileName)
    
    disp(rrr)
    
    % load file
    filename = [PathName,filesep,FileName{rrr}];
    [f,fs] = audioread(filename);
    
    % Determine total number of samples in audio file
    N = size(f,1); 
    
    % Get the spectrum
    df = fs / N;
    %w = (-(N/2):(N/2)-1)*df;
    y = fft(f(:,1), N) / N;
    y2 = fftshift(y);
    
    % setup bandpath filter
    n = 7;
    Freq1 = beginFreq / (fs/2);
    Freq2 = endFreq / (fs/2);
    [b,a] = butter(n, [Freq1, Freq2], 'bandpass');
    
    % apply filter
    f_filtered = filter(b, a, f);
    
    % calculate rolling SD
    s=nan(length(f_filtered)-stepw,1);
    for ii=1:length(f_filtered)-stepw
        s(ii)=std(f_filtered(ii:ii+stepw-1));
        %     v(ii)=var(f_filtered(ii:ii+stepw-1));
    end
    
    % detect values over threshold
    d4x=find(s>thresh4*max(s(:)));
    d4x(d4x<startvalue/1000*fs)=[];
%     d4=zeros(size(f));
%     d4(d4x)=1;
%     
    % get first time reaching threshold
    firstthresh = min(d4x)/1000*fs; % BG edited (originally firstthresh = min(d4x)/fs;)
    res(rrr)=firstthresh;
    
    if produce_txtfile
        % write into text file
        fprintf(FID,[FileName{rrr},'\t']);
        fprintf(FID,[num2str(firstthresh),'\t']);
        if firstthresh<startvalue/1000
            fprintf(FID,'?\n');
        else
            fprintf(FID,'\n');
        end
    end
end

if produce_txtfile
    fclose(FID);
end

%get the mean
meanThreshold = mean(res,'omitnan');

if produce_plot
    outputfilename2 = ['thresholds_plot_',out{length(out)-1},'_filter',num2str(beginFreq),'to',num2str(round(endFreq/1000)),'k_thresh',num2str(thresh4),'_',actdat,'.bmp'];
    h=figure;
    plot(res)
    xlabel('soundfiles')
    ylabel('milliseconds')
    xlim([1 length(res)])
    if exist('customYlim','var'); ylim([0 customYlim]); end
    hold on
    plot(xlim, [1 1]*meanThreshold, ':k'); hold off
    saveas(h,outputfilename2,'bmp')
end


