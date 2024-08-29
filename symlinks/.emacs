;; Red Hat Linux default .emacs initialization file
;; The file that emacs defaults to is located at:
;; /net/cyclops/u2/people/tilfordc

;; Add MELPA
(require 'package)
(let* ((no-ssl (and (memq system-type '(windows-nt ms-dos))
                    (not (gnutls-available-p))))
       (proto (if no-ssl "http" "https")))
  (when no-ssl (warn "\
Your version of Emacs does not support SSL connections,
which is unsafe because it allows man-in-the-middle attacks.
There are two things you can do about this warning:
1. Install an Emacs version that does support SSL and be safe.
2. Remove this warning from your init file so you won't see it again."))
  (add-to-list 'package-archives (cons "melpa" (concat proto "://melpa.org/packages/")) t)
  ;; Comment/uncomment this line to enable MELPA Stable if desired.
  ;; See `package-archive-priorities` and
  ;; `package-pinned-packages`. Most users will not need or want to do
  ;; this.  (add-to-list 'package-archives (cons "melpa-stable"
  ;; (concat proto "://stable.melpa.org/packages/")) t)
  )

;; Added by Package.el.  This must come before configurations of
;; installed packages.  Don't delete this line.  If you don't want it,
;; just comment it out by adding a semicolon to the start of the line.
;; You may delete these explanatory comments.

(package-initialize)

(setq load-path (cons (concat (getenv "HOME") "/.lisp") load-path))
(setq load-path (cons (concat (getenv "HOME") "/lisp") load-path))

(setq vc-follow-symlinks t)

;; wiki mode
;; (add-to-list 'load-path "/path/to/the/directory/where/emacs-wiki/resides/")
;; (setq load-path (cons (concat (getenv "HOME") "/lisp/emacs-wiki-2.70/") load-path))
;; (require 'emacs-wiki)
;; (require 'wiki)

;; tilfordc major mode that does simple markup on Twiki wiki syntax
;; (require 'wiki-cat)

;; Prevent loading of Bob's default.el
(setq inhibit-default-init t)

;; Set mouse wheel to scroll
(defun up-slightly () (interactive) (scroll-up 8))
(defun down-slightly () (interactive) (scroll-down 8))
(global-set-key [mouse-4] 'down-slightly)
(global-set-key [mouse-5] 'up-slightly)
(global-set-key "\C-f" 'goto-line)

;; Set movement keys to something that will not make me schizo when I move
;; between Macs and PCs
(global-set-key [end] 'end-of-buffer)
(global-set-key [home] 'beginning-of-buffer)
(global-set-key "\C-z" 'undo)

;; Define a BIG font
(defun big-font () (interactive) 
  (set-default-font "-adobe-courier-bold-r-normal-*-*-240-*-*-m-*-iso8859-2")
  ;; (setq default-frame-alist '((height . 10)))
  ;; (setq frame-height selected-frame 10)
  )
(global-set-key [(control ?\=)] 'big-font)


;; Prevent Bob from setting delete to backward-delete-char
(setq inhibit-mmm-delete t)
;; Prevent Bob from supressing line numbering
(setq inhibit-mmm-line-number-mode-inhibition t)

;; Explicitly redefine key in case other systems do not have that flag
(global-set-key [delete] 'delete-char)

;; Printer
;; (setq lpr-switches '("-Pb3a047b") )

;;; Prevent Extraneous Tabs
(setq-default indent-tabs-mode nil)


(setq default-frame-alist '((font . "-schumacher-clean-medium-r-normal--12-*-*-*-c-*-iso8859-1")
                            (user-position . t) 
                            (user-size . t) 
                            (left . 1620) 
                            (height . 70) 
                            (width . 80)))


;; background was DarkSlateGray
(set-background-color "#000022")
;; foreground was wheat F5DEB3 #FFCC99
(set-foreground-color "wheat")
(set-cursor-color "green")
;;(set-cursor-color "Coral")
;;(set-mouse-color "Coral")
;; Change hightlight colors:
(modify-face 'region nil "DarkOrchid" nil t nil nil)
(autoload 'sxml-mode "sxml-mode" "Major mode for editing XML documents." t)

(autoload 'css-mode "css-mode")
(setq auto-mode-alist       
     (cons '("\\.css\\'" . css-mode) auto-mode-alist))

(autoload 'html-helper-mode "html-helper-mode")
(setq auto-mode-alist       
     (cons '("\\.html\\'" . html-helper-mode) auto-mode-alist))

(delete-selection-mode nil)
(transient-mark-mode t)

;;; https://www.gnu.org/software/emacs/manual/html_node/efaq/Displaying-the-current-file-name-in-the-titlebar.html
(setq frame-title-format "%b")

;;; Do not display newbie message on new startup
(setq inhibit-startup-message t)
;;; Disable down-arrow and C-n at end of a buffer from adding new lines
(setq next-line-add-newlines nil)

;;; Automatically makes the matching paren stand out in color.
(condition-case err
    (show-paren-mode t)
  (error
   (message "Cannot show parens %s" (cdr err))))
;;;


;; Uncomment if using abbreviations
;; (abbrev-mode t)
;; -----------------------------------------------------------
;;
;; From http://acuity.cis.ohio-state.edu:8888/PendingProjects/emacs-xml.html
;; and  http://www.oasis-open.org/cover/psgml-fonts.html
;; and http://www.oasis-open.org/cover/psgmlFlynn19981013.html

(setq screenshots nil)   ; t for screenshot color settings, else nil
(make-face 'sgml-comment-face)    ; comment
(make-face 'sgml-start-tag-face)  ; start-tag
(make-face 'sgml-end-tag-face)    ; end-tag
(make-face 'sgml-entity-face)     ; entity
(make-face 'sgml-doctype-face)    ; doctype
(make-face 'sgml-ignored-face)    ; ignored
(make-face 'sgml-ms-start-face)   ; ms-start
(make-face 'sgml-ms-end-face)     ; ms-end
(make-face 'sgml-short-ref-face)  ; short-ref
(make-face 'sgml-pi-face)         ; pi
(make-face 'sgml-sgml-face)       ; sgml

(cond ((equal screenshots nil)   
       (set-face-foreground 'sgml-comment-face "red")
       (set-face-foreground 'sgml-start-tag-face "gold")
       (set-face-foreground 'sgml-end-tag-face "gold")
       (set-face-background 'sgml-entity-face "orange")
       (set-face-foreground 'sgml-entity-face "blue")
       (set-face-foreground 'sgml-doctype-face "lawngreen")
       (set-face-foreground 'sgml-pi-face "chocolate")
       (set-face-background 'sgml-ignored-face "gray90")
       (set-face-foreground 'sgml-ms-end-face "maroon")
       (set-face-foreground 'sgml-ms-start-face "maroon")
       )
      ((equal screenshots t)                             ; This set for screen shots
       (set-background-color "White")
       (set-face-foreground 'sgml-comment-face "White")  ; Comments: white on
       (set-face-background 'sgml-comment-face "Gray")   ; gray. 
       (set-face-background 'sgml-start-tag-face "Gray") ; Tags: black (default)
       (set-face-background 'sgml-end-tag-face "Gray")   ; on gray.
       (set-face-foreground 'sgml-entity-face "White")   ; Entity references:
       (set-face-background 'sgml-entity-face "Black")   ; white on black. 
       )
      (t nil))

(setq sgml-markup-faces
      '((comment   . sgml-comment-face)
	(start-tag . sgml-start-tag-face)
	(end-tag   . sgml-end-tag-face)
	(doctype   . sgml-doctype-face)
	(pi        . sgml-pi-face)
	(ignored   . sgml-ignored-face)
	(ms-start  . sgml-ms-start-face)
	(ms-end    . sgml-ms-end-face)
	(entity    . sgml-entity-face)))

(setq-default sgml-auto-activate-dtd t)
(setq sgml-set-face t)  ; without this, all SGML text is in same color
;

(global-font-lock-mode 3)

;; --------------------------------------


;; javascript mode
;; (autoload 'javascript-mode "javascript-mode" "JavaScript mode" t)
(setq auto-mode-alist (append '(("\\.js$" . java-mode))
			      auto-mode-alist))


;
(custom-set-variables
 '(line-number-mode t)
 '(case-fold-search t)
 '(pop-up-windows nil)
 '(menu-bar-mode t t)
 '(show-paren-mode t nil (paren))
 '(current-language-environment "ASCII")
 '(global-font-lock-mode t nil (font-lock))
 '(pop-up-frames nil)
 '(even-window-heights nil))
(custom-set-faces)

(put 'downcase-region 'disabled nil)

(put 'upcase-region 'disabled nil)

(defun dos-to-unix ()
  "Convert a DOS buffer to Unix format."
  (interactive)
  (beginning-of-buffer)
  (replace-string "\r\n" "\n")
  (replace-string "\n\r" "\n")
  (replace-string "\r" "\n"))

;; node.js mode
;; https://github.com/abicky/nodejs-repl.el
;; (require 'nodejs-repl)

;; Markdown major mode
;; http://jblevins.org/projects/markdown-mode/
(autoload 'markdown-mode "markdown-mode"
  "Major mode for editing Markdown files" t)
(add-to-list 'auto-mode-alist '("\\.markdown\\'" . markdown-mode))
(add-to-list 'auto-mode-alist '("\\.md\\'" . markdown-mode))
;; Will use polymode (below) for Rmd files instead
;; (add-to-list 'auto-mode-alist '("\\.Rmd\\'" . markdown-mode))

(add-to-list 'load-path "/home/tilfordc/ESS/lisp/")
(require 'ess-site)
;; STOP with the stupid _ === <- insanity!!
(ess-toggle-underscore nil)

;; Polymode - for files with mixed content, like R+Markdown
;; https://github.com/vspinu/polymode
(setq load-path (cons (concat (getenv "HOME") "/.lisp/polymode") load-path))
(setq load-path (cons (concat (getenv "HOME") "/.lisp/polymode/modes") load-path))

(require 'poly-R)
(require 'poly-markdown)

(add-to-list 'auto-mode-alist '("\\.Rmd" . poly-markdown+r-mode))

