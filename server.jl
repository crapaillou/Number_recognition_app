using Oxygen
using HTTP
using FileIO, Plots, Images, JLD2

#load machine learing algorithm
weight_bias_list = load("/media/adrien/Linux_disk/coding_project/julia_server/stacked_weight_bias.jld2")
weight_list, bias_list = weight_bias_list["weight"], weight_bias_list["bias"]


#load web page
function render_file(path::String)
    io = open(path, "r") do file
        read(file, String)
    end
    return io
end

function pre_pro(content)
    width, height = content.width, content.height
    data = content.data
    data = Int.(data)
    mat_img = reshape(data, (width,height))
    
    
    # Apply the Gaussian filter with proper padding
    filtered_img = imfilter(mat_img, Kernel.gaussian(3))
    
    filtered_img = imresize(filtered_img,(16,16))

    #filtered_img = imresize(mat_img,(16,16))
    
    padded_matrix = add_padding(filtered_img, 6)
    
    heatPlot = heatmap(padded_matrix)
    savefig(heatPlot, "heatmap_plot.png")
    
    padded_stream = reshape(padded_matrix, :)
    return padded_stream
end

function add_padding(original_matrix, padding)
    # Dimensions of the original matrix
    original_height, original_width = size(original_matrix)

    # Create a larger matrix with padding
    padded_height = original_height + 2 * padding
    padded_width = original_width + 2 * padding

    # Initialize a new matrix with the desired padded size
    padded_matrix = zeros(Float64, padded_height, padded_width)

    # Copy the original matrix into the center of the padded matrix
    padded_matrix[(padding + 1):(padding + original_height), (padding + 1):(padding + original_width)] = original_matrix

    return padded_matrix

end

sigmoid(z) = 1.0/(1.0+ exp(-z))

function feed_forwardS(matrix_im, weight_list, bias_list)
    temp = sigmoid.(matrix_im)
    len = length(weight_list)
    for i in 1:len
        temp = weight_list[i] * temp + bias_list[i] 
        temp = sigmoid.(temp)
    
    end
    return temp
end

function VectorToNumber(res)
    if maximum(res) < 0.4
        return "unknown"
    else 
        return argmax(res)[1] - 1
    end
end

vec_path = ["public/Index.html","public/styles/styles.css","public/scripts/index.js"]

render_vec = [render_file(path) for path in vec_path]
###

#handle get req

@get "/" function(req::HTTP.Request)
    return render_vec[1]
end

@get "styles/styles.css" function(req::HTTP.Request)
    response = HTTP.Response(200, Dict("Content-Type" => "text/css"), render_vec[2])
    return response
end

@get "/scripts/index.js" function(req::HTTP.Request)
    response = HTTP.Response(200, Dict("Content-Type" => "application/javascript"),render_vec[3])
    return response
end


####

@post "/process_image" function (req::HTTP.Request)
    content = json(req).imageData
    
    # resize and filter the image
    padded_matrix = pre_pro(content)
    
    #processing the matrix to a number_image
    res = feed_forwardS(padded_matrix, weight_list, bias_list)
    final_result = VectorToNumber(res)
    
    # Construct a response indicating successful processing and save
    response_content = "You might have drawn a : $final_result"
    response = HTTP.Response(200, Dict("Content-Type" => "text/plain"), response_content)
    return response
end


serve(port=3000)



