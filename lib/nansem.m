function semval = nansem(vector_data)
    % Recall that s.e.m. = std(x)/sqrt(length(x));
    nonan_std = nanstd(vector_data);
    nonan_len = length(vector_data(~isnan(vector_data)));
    % Plug in values
    semval = nonan_std / sqrt(nonan_len);
end
