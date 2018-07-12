require 'sinatra'
require 'json'
require 'open-uri'
require 'securerandom'
require 'lightly'

lightly = Lightly.new life: 86400

set :public_folder, File.dirname(__FILE__) + '/dist'

get '/users/:user' do
	content_type :json

	lightly.get params['user'] do
		puts params['user']
		user = params['user']
		initial = open "https://vsco.co/content/Static/userinfo",
			'Cookie' => "vs_anonymous_id=#{SecureRandom.uuid}",
			'Referer' => "https://vsco.co/#{user}/images/1"
		vs = JSON.parse(initial.read[/{.+}/])['tkn']

		begin
			sites = JSON.load open "https://vsco.co/ajxp/#{vs}/2.0/sites?subdomain=#{user}", 'Cookie' => "vs=#{vs}"
			site_id = sites['sites'][0]['id']
		rescue OpenURI::HTTPError => e
			return 404, 'user not found' if e.message == "404 Not Found"
		end

		page = 1
		size = 1000
		images = []
		loop do
			puts page
			response = JSON.load open "https://vsco.co/ajxp/#{vs}/2.0/medias?site_id=#{site_id}&page=#{page}&size=#{size}", 'Cookie' => "vs=#{vs}"
			images.concat response['media']
			break if response['total'] <= page * size
			page += 1
		end

		images.to_json
	end
end
