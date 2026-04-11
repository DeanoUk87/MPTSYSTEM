<?php

namespace App\Http\Controllers\FrontEnd;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\Uploader;
use App\Models\System\Post;
use Illuminate\Http\Request;

class PostsController extends Controller
{
    use Uploader;

    /**
     * Display post view.
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function index(Request $request)
    {
        $posts = Post::orderBy('id', 'DESC')->paginate(6);

        // send to view
        return view('frontend.posts.index', ['posts' => $posts])->with('i', ($request->input('page', 1) - 1) * 6);
    }

    /**
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function details($id)
    {
        $post = Post::findOrFail($id);

        return view('frontend.posts.details', compact('post'));
    }
}
