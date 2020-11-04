library(jsonlite)
source('parseJSONdata.R')

root <- getwd()
directory <- "wait_for_mic_approval_false/delay_0ms"
filenames <- list.files(directory, 
              pattern = '.txt', all.files = FALSE,
              full.names = TRUE, recursive = TRUE,
              ignore.case = FALSE, include.dirs = TRUE, no.. = FALSE)

for (i in 1:length(filenames)) {
  data_file <- file(paste(root,'/',filenames[i], sep=""), open = "r")
  raw_data <- readLines(data_file, warn = FALSE)
  close(data_file)
  id <- strsplit(strsplit(filenames[i],"jatos_data_resultID_")[[1]][2], ".txt")[[1]][1]
  all_data <- parseJSONdata(raw_data, numComponents=1, isJsonStr=TRUE, id=id, returnResults=TRUE, saveToFile=FALSE)
  all_data <- all_data[-3,] # remove the 3rd trial - this is the recording check with data saved as long base64 string
  file_dir <- strsplit(filenames[i],"jatos_data_resultID_")[[1]][1]
  write.csv(all_data, paste(file_dir, "jatos_data_resultID_", id, ".csv", sep=""), row.names=FALSE)
}