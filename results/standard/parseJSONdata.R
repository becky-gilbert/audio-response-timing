parseJSONdata <- function(fileName, numComponents=1, fileOutSuffixes=c("output"), isJsonStr=FALSE, id=NULL, saveToFile=FALSE, returnResults=TRUE) {
  # Inputs:
  # fileName: (string) path to a single txt file containing the data downloaded from JATOS (JSON format)
  # numComponents: (num) number of JATOS components that the data corresponds to. This will be the same as the number of lines
  #  in the file to be parsed (1 line on JSON per JATOS component).
  #  If not specified, then the expected number of components (JSON lines) in the file is 1. 
  # fileOutSuffixes: (array of strings) suffix(es) to be added to the file name to form the new file name for the 
  #  resulting CSV file for each component. This should be an array with length equal to numComponents. Suffixes are assigned in 
  #  the same order as the components in the file.
  # saveToFile: (boolean) should the results be saved to a file (default is FALSE)
  # returnResults: (boolean) should the function return the results (default is TRUE)
  
  # Output:
  # if returnResults is TRUE: 
  #  A dataframe containing the parsed data, or list of dataframes
  # if saveToFile is TRUE:
  #  A file containing the JSON data in csv format, saved in the current directory, named 
  #  as the original file name + the suffix, e.g. "my_data.txt" -> my_data_output.csv"
  
  # Becky Gilbert, Oct 2017
  
  require(jsonlite)
  
  if (!(isJsonStr)) {
    dataFileCon <- file(paste(fileName, ".txt", sep=""), open = "r")
    rawData <- readLines(dataFileCon, warn = FALSE)
    close(dataFileCon)
  } else {
    if (is.null(id) || (!(is.character(id)))) {
      cat("\nWarning: when isJsonStr is TRUE, a valid string must be given for the 'id' argument.")
      return()
    }
    rawData <- fileName
    fileName <- id
  }
  
  # expecting one line of JSON for each component
  if (length(rawData) != numComponents) {
    cat(paste("\nWarning: file", fileName, "does not contain the expected number of components. Skipping this file.\n"))
    cat(paste("\nExpected",numComponents,"components, found",length(rawData),"JSON lines.\n"))
    return() 
  }
  
  # expecting one file out suffix for each component
  if (numComponents != length(fileOutSuffixes)) {
    cat(paste("\nWarning: file ", fileName, ", number of components specified not equal to number of file out suffixes.\n"))
    cat(paste("\nnumComponents = ",numComponents,", fileOutSuffixes = ",length(fileOutSuffixes),".\n"))
    return() 
  }
  
  # for each line (set of component results)
  for (i in 1:length(rawData)) {
    
    jsonLineIsArray <- FALSE
    
    currResults <- rawData[i]
    
    # is it valid JSON?
    isStringValid <- validate(currResults)
    
    if (!isStringValid) {
      
      # if not valid JSON, it may need brackets at the start/end
      # combine all elements into array to make it valid JSON
      currResultsArray <- paste("[",currResults,"]",sep="")
      isArrayValid <- validate(currResultsArray)
      
      if (!isArrayValid) {
        # can't get the string to parse into valid JSON
        cat(paste('\nWarning: file ',fileName,' is not valid JSON.',sep=""))
        cat(paste('\n',attr(isArrayValid,"err"),'\n',sep=""))
        return() 
      } else {
        #jsonLineIsArray <- TRUE
        currResults <- currResultsArray
      }
    }
    
    # check if JSON string is array
    containsMultJsonObjects <- grepl("},{",currResults,fixed=TRUE)
    currResultsSplit <- strsplit(currResults,split="")
    if (currResultsSplit[[1]][1] == "[" && containsMultJsonObjects) {
      jsonLineIsArray <- TRUE 
    }
    
    # convert JSON string to data frame list
    currResultsList <- fromJSON(currResults, flatten = TRUE)
    
    # convert data frame list to data frame
    if (!jsonLineIsArray || (class(currResultsList) == "data.frame")) {
      # if it's a list, remove any null elements
      if (class(currResultsList) == "list" && (length(which(sapply(currResultsList, is.null)))>0)) {
        currResultsList <- currResultsList[-which(sapply(currResultsList, is.null))] 
      }
      # if this line of JSON is not an array then convert it to a data frame
      currResultsCSV <- as.data.frame(currResultsList)
      # check to see if any of the columns are lists, and if so, convert them to character (otherwise write.csv will fail)
      currResultsClasses<-sapply(currResultsCSV,class)
      if (length(which(currResultsClasses=="list")) == 0) {
        colsToRemove <- NULL
        for (l in 1:length(currResultsCSV)) {
          # See if any of the cells are valid JSON. This is to deal with the 'view_history' nested JSON. 
          # Note: this will only work when there's one row in the data frame!
          if (is.character(currResultsCSV[,l]) && validate(currResultsCSV[,l]) && is.data.frame(fromJSON(currResultsCSV[,l]))) {
            # DP: Error found here when processing Cattell data below line read fromJSON(currResultsCSV[,1])
            currResultsCSV <- merge(currResultsCSV, fromJSON(currResultsCSV[,l]))
            colsToRemove <- c(colsToRemove, l)
          }
        }
        if (!is.null(colsToRemove)) {
          currResultsCSV <- currResultsCSV[,-colsToRemove]
        }
        if (saveToFile) {
          # write the csv file
          currFileSuffix <- fileOutSuffixes[i]
          write.csv(currResultsCSV, paste(fileName, "_", currFileSuffix, ".csv", sep=""), row.names=FALSE)
        }
        if (returnResults) {
          return(currResultsCSV)
        }
      } else {
        for (k in 1:length(which(currResultsClasses=="list"))) {
          colIndex <- as.integer(which(currResultsClasses=="list")[k])
          currResultsCSV[,colIndex]<-vapply(currResultsCSV[,colIndex], paste, collapse=",", character(1L)) 
        }
        if (saveToFile) {
          currFileSuffix <- fileOutSuffixes[i]
          write.csv(currResultsCSV, paste(fileName, "_", currFileSuffix, ".csv", sep=""), row.names=FALSE) 
        }
        if (returnResults) {
          return(currResultsCSV)
        }
      }
    } else {
      # if this line of JSON is an array, then need to parse each item in the array
      allResultsList <- list()
      for (j in 1:length(currResultsList)) {
        # get the JSON from this index
        currResultsCSV <- as.data.frame(currResultsList[[j]])
        # check to see if any of the columns are lists, and if so, convert them to character (otherwise write.csv will fail)
        currResultsClasses<-sapply(currResultsCSV,class)
        if (length(which(currResultsClasses=="list")) == 0) {
          if (saveToFile) {
            # write the csv file
            currFileSuffix <- fileOutSuffixes[i]
            write.csv(currResultsCSV, paste(fileName,"_",currFileSuffix,"_",j,".csv",sep=""),row.names=FALSE)
          }
          allResultsList[[j]] <- currResultsCSV
        } else {
          # convert each column of class 'list' to character
          for (k in 1:length(which(currResultsClasses=="list"))) {
            colIndex <- as.integer(which(currResultsClasses=="list")[k])
            currResultsCSV[,colIndex]<-vapply(currResultsCSV[,colIndex], paste, collapse=",", character(1L)) 
          }
          if (saveToFile) {
            # write the csv file
            currFileSuffix <- fileOutSuffixes[i]
            write.csv(currResultsCSV, paste(fileName,"_",currFileSuffix,"_",j,".csv",sep=""),row.names=FALSE)
          }
          allResultsList[[j]] <- currResultsCSV
        }
      }
      if (returnResults) {
        return(allResultsList)
      }
    }
  }
}
