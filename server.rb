require 'sinatra'
require 'json'
require 'open-uri'
require 'securerandom'
require 'lightly'

lightly = Lightly.new life: 86400

set :public_folder, File.dirname(__FILE__) + '/dist'

# bearer token seems to be hardcoded for logged out users
authorization = "Bearer 7356455548d0a1d886db010883388d08be84d0c9"
# api seems to 403 on requests with no user-agent
user_agent = "vsco-map"

headers = { 'Authorization' => authorization, 'User-Agent' => user_agent }

get '/' do
	send_file File.join(settings.public_folder, 'index.html')
end

get '/ping' do
	'pong'
end

get '/users/:user' do
	content_type :json

	lightly.get params['user'] do
		puts params['user']
		user = params['user']

		begin
			sites = JSON.load open "https://vsco.co/api/2.0/sites?subdomain=#{user}", headers
			site_id = sites['sites'][0]['id']
		rescue OpenURI::HTTPError => e
			return 404, 'user not found' if e.message == "404 Not Found"
		end

		page = 1
		size = 1000
		images = []
		loop do
			puts page
			response = JSON.load open "https://vsco.co/api/2.0/medias?site_id=#{site_id}&page=#{page}&size=#{size}", headers
			images.concat response['media']
			break if response['total'] <= page * size
			page += 1
		end

		images.to_json
	end
end
